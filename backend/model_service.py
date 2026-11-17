
from __future__ import annotations

import base64
import io
import json
from pathlib import Path
from typing import Iterable

import numpy as np
import tensorflow as tf
from lime import lime_image
from PIL import Image
from skimage.segmentation import mark_boundaries

from recommendations import INVALID_LABELS, get_diagnosis_info, label_display_name

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
CUSTOM_MODEL_DIR = MODEL_DIR / "custom_mobilenetv2"
MODEL_PATH = CUSTOM_MODEL_DIR / "drzea_maize_mobilenetv2.keras"
LABELS_PATH = CUSTOM_MODEL_DIR / "labels.json"
IMAGE_SIZE = (224, 224)


def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        return json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    return []


def _encode_pil_image(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _overlay_heatmap(
    image_array: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.42,
) -> Image.Image:
    image = image_array.astype("float32")
    heatmap = np.uint8(255 * heatmap)

    color_map = tf.keras.utils.array_to_img(
        np.stack([
            heatmap,
            np.clip(heatmap * 0.55, 0, 255),
            np.clip(255 - heatmap * 0.8, 0, 255),
        ], axis=-1)
    )

    color_array = np.array(
        color_map.resize((image.shape[1], image.shape[0]))
    )

    overlay = np.clip(
        image * (1 - alpha) + color_array * alpha,
        0,
        255
    ).astype("uint8")

    return Image.fromarray(overlay)


class ModelService:

    def __init__(self) -> None:
        self.model = None
        self.grad_model = None
        self.labels = _load_labels()

        if MODEL_PATH.exists():
            self.load()

    def load(self) -> None:
        self.model = tf.keras.models.load_model(MODEL_PATH)
        self.labels = self.labels or _load_labels()

        last_conv = self._find_last_conv_layer_name()

        self.grad_model = tf.keras.models.Model(
            inputs=self.model.inputs,
            outputs=[
                self.model.get_layer(last_conv).output,
                self.model.output
            ],
        )

    def ready(self) -> bool:
        return (
            self.model is not None
            and bool(self.labels)
            and self.grad_model is not None
        )

    def _find_last_conv_layer_name(self) -> str:
        # Verified MobileNetV2 Grad-CAM layer
        try:
            layer = self.model.get_layer("out_relu")
            if len(layer.output.shape) == 4:
                return layer.name
        except (ValueError, AttributeError):
            pass

        # Fallback: find the last 4D feature-map layer
        for layer in reversed(self.model.layers):
            try:
                if len(layer.output.shape) == 4:
                    return layer.name
            except (AttributeError, ValueError, TypeError):
                continue

        raise RuntimeError(
            "No convolutional layer found for Grad-CAM."
        )

    def preprocess(
        self,
        image: Image.Image
    ) -> tuple[np.ndarray, np.ndarray]:

        rgb_image = image.convert("RGB")
        resized = rgb_image.resize(IMAGE_SIZE)

        image_array = np.array(
            resized,
            dtype="float32"
        )

        batch = tf.keras.applications.mobilenet_v2.preprocess_input(
            np.expand_dims(image_array.copy(), axis=0)
        )

        return image_array, batch

    def predict(self, image: Image.Image) -> dict:

        if not self.ready():
            raise RuntimeError("Model is not ready.")

        image_array, batch = self.preprocess(image)

        probabilities = self.model.predict(
            batch,
            verbose=0
        )[0]

        ranked_indices = np.argsort(probabilities)[::-1]

        top_index = int(ranked_indices[0])
        label = self.labels[top_index]

        gradcam_heatmap = self.make_gradcam_heatmap(
            batch,
            top_index
        )

        gradcam_image = _overlay_heatmap(
            image_array,
            gradcam_heatmap
        )

        affected_zones = self.extract_affected_zones(
            gradcam_heatmap
        )

        lime_image_b64 = self.make_lime_explanation(
            image_array
        )

        diagnosis = get_diagnosis_info(label)

        predictions = [
            {
                "className": self.labels[index],
                "label": label_display_name(self.labels[index]),
                "probability": float(probabilities[index]),
            }
            for index in ranked_indices[:4]
        ]

        return {
            "primary": predictions[0],
            "rankedPredictions": predictions,
            "diagnosisInfo": diagnosis,
            "affectedZones": affected_zones,
            "gradcamImage": _encode_pil_image(gradcam_image),
            "limeImage": lime_image_b64,
            "isInvalid": label in INVALID_LABELS,
        }

    def make_gradcam_heatmap(
        self,
        batch: np.ndarray,
        class_index: int
    ) -> np.ndarray:

        with tf.GradientTape() as tape:
            conv_outputs, predictions = self.grad_model(batch)
            loss = predictions[:, class_index]

        gradients = tape.gradient(loss, conv_outputs)

        pooled_gradients = tf.reduce_mean(
            gradients,
            axis=(0, 1, 2)
        )

        conv_outputs = conv_outputs[0]

        heatmap = tf.reduce_sum(
            tf.multiply(pooled_gradients, conv_outputs),
            axis=-1
        )

        heatmap = tf.maximum(heatmap, 0) / (
            tf.math.reduce_max(heatmap) + 1e-8
        )

        return heatmap.numpy()

    def extract_affected_zones(
        self,
        heatmap: np.ndarray
    ) -> list[str]:

        if heatmap.size == 0:
            return ["mid-leaf region"]

        upsampled = np.array(
            Image.fromarray(
                np.uint8(heatmap * 255)
            ).resize((4, 4))
        ) / 255.0

        names = [
            "top-left", "top-center-left", "top-center-right", "top-right",
            "upper-left", "upper-center-left", "upper-center-right", "upper-right",
            "mid-left", "center-left", "center-right", "mid-right",
            "bottom-left", "bottom-center-left", "bottom-center-right", "bottom-right",
        ]

        ranked = np.argsort(upsampled.reshape(-1))[::-1]

        zones = [
            names[idx]
            for idx in ranked[:3]
            if upsampled.reshape(-1)[idx] >= 0.45
        ]

        return zones or ["mid-leaf region"]

    def make_lime_explanation(
        self,
        image_array: np.ndarray
    ) -> str:

        explainer = lime_image.LimeImageExplainer()

        def predictor(images: Iterable[np.ndarray]) -> np.ndarray:
            stacked = np.array(
                list(images),
                dtype="float32"
            )

            preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(
                stacked.copy()
            )

            return self.model.predict(
                preprocessed,
                verbose=0
            )

        explanation = explainer.explain_instance(
            image_array.astype("double"),
            predictor,
            top_labels=1,
            hide_color=0,
            num_samples=400,
        )

        top_label = explanation.top_labels[0]

        temp, mask = explanation.get_image_and_mask(
            top_label,
            positive_only=True,
            num_features=6,
            hide_rest=False,
        )

        explained = np.uint8(
            mark_boundaries(temp / 255.0, mask) * 255
        )

        return _encode_pil_image(
            Image.fromarray(explained)
        )


model_service = ModelService()
