from __future__ import annotations

import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image

from recommendations import (
    INVALID_LABELS,
    SUPPORTED_LABELS,
    get_diagnosis_info,
    label_display_name,
)

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
MODEL_PATH = BASE_DIR / "models" / "lightweight-visual-scanner"
LABELS_PATH = BASE_DIR / "models" / "labels.json"
PUBLIC_METADATA_PATH = PROJECT_DIR / "public" / "model" / "metadata.json"
DEFAULT_LABELS = [
    "Healthy leaf",
    "Common_rust",
    "Northern leaf Blight",
    "Gray_leaf_spot",
]


def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        labels = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
    elif PUBLIC_METADATA_PATH.exists():
        metadata = json.loads(PUBLIC_METADATA_PATH.read_text(encoding="utf-8"))
        labels = metadata.get("labels", [])
    else:
        labels = DEFAULT_LABELS

    supported = [label for label in labels if label in SUPPORTED_LABELS]
    return supported or DEFAULT_LABELS


def _encode_pil_image(image: Image.Image) -> str:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _normalize(score: np.ndarray) -> np.ndarray:
    score = np.maximum(score, 0)
    return score / (np.max(score) + 1e-8)


def _make_visual_heatmap_from_image(image_array: np.ndarray, label: str) -> np.ndarray:
    image = image_array.astype("float32")
    red = image[:, :, 0]
    green = image[:, :, 1]
    blue = image[:, :, 2]
    brightness = np.mean(image, axis=2)
    saturation = np.max(image, axis=2) - np.min(image, axis=2)

    normalized_label = label.lower()
    if "rust" in normalized_label:
        score = red * 0.7 + saturation * 0.45 - green * 0.25 - blue * 0.25
    elif "gray" in normalized_label or "spot" in normalized_label or "cercospora" in normalized_label:
        score = np.abs(red - green) * 0.45 + (165 - brightness) * 0.45 + saturation * 0.28
    elif "blight" in normalized_label:
        score = red * 0.48 + green * 0.3 + (150 - brightness) * 0.45 - blue * 0.25
    else:
        score = saturation * 0.25 + np.abs(red - green) * 0.2

    return _normalize(score)


def _overlay_heatmap(
    image_array: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.42,
) -> Image.Image:
    image = image_array.astype("float32")
    heatmap = np.uint8(255 * heatmap)
    red = heatmap
    green = np.clip(heatmap * 0.55, 0, 255).astype("uint8")
    blue = np.clip(255 - heatmap * 0.8, 0, 255).astype("uint8")
    color_array = np.stack([red, green, blue], axis=-1)
    overlay = np.clip(image * (1 - alpha) + color_array * alpha, 0, 255).astype("uint8")
    return Image.fromarray(overlay)


class ModelService:
    def __init__(self) -> None:
        self.labels = _load_labels()

    def ready(self) -> bool:
        return bool(self.labels)

    def predict(self, image: Image.Image) -> dict:
        rgb_image = image.convert("RGB")
        resized = rgb_image.resize((224, 224))
        image_array = np.array(resized, dtype="float32")
        label_scores = self._score_image(image_array)
        ranked = sorted(label_scores.items(), key=lambda item: item[1], reverse=True)
        total = sum(score for _, score in ranked) or 1.0

        predictions = [
            {
                "className": label,
                "label": label_display_name(label),
                "probability": float(score / total),
            }
            for label, score in ranked[:4]
        ]

        primary = predictions[0]
        label = primary["className"]
        heatmap = _make_visual_heatmap_from_image(image_array, label)
        heatmap_image = _overlay_heatmap(image_array, heatmap)
        diagnosis = get_diagnosis_info(label)

        return {
            "primary": primary,
            "rankedPredictions": predictions,
            "diagnosisInfo": diagnosis,
            "affectedZones": self.extract_affected_zones(heatmap),
            "gradcamImage": _encode_pil_image(heatmap_image),
            "limeImage": "",
            "isInvalid": label in INVALID_LABELS,
        }

    def _score_image(self, image_array: np.ndarray) -> dict[str, float]:
        red = image_array[:, :, 0]
        green = image_array[:, :, 1]
        blue = image_array[:, :, 2]
        brightness = np.mean(image_array, axis=2)
        saturation = np.max(image_array, axis=2) - np.min(image_array, axis=2)

        rust_pixels = (
            (red > 85)
            & (green > 35)
            & (blue < 135)
            & (red > blue * 1.12)
            & ((red > green * 0.92) | ((red - blue) > 38))
            & (saturation > 24)
        )
        gray_pixels = (
            (brightness < 155)
            & (np.abs(red - green) < 35)
            & (saturation < 68)
            & ~rust_pixels
        )
        blight_pixels = (
            (red > 95)
            & (green > 80)
            & (brightness < 170)
            & (saturation > 22)
            & ~rust_pixels
        )
        green_pixels = (
            (green > red * 0.95)
            & (green > blue * 1.04)
            & (brightness > 70)
            & (saturation > 18)
        )

        rust_ratio = float(np.mean(rust_pixels))
        gray_ratio = float(np.mean(gray_pixels))
        blight_ratio = float(np.mean(blight_pixels))
        green_ratio = float(np.mean(green_pixels))
        lesion_ratio = min(1.0, rust_ratio + gray_ratio + blight_ratio)
        healthy_bonus = max(green_ratio - lesion_ratio * 1.4, 0.0)

        scores = {
            "Common_rust": 0.16 + rust_ratio * 8.5,
            "Gray_leaf_spot": 0.12 + gray_ratio * 3.1,
            "Northern leaf Blight": 0.12 + blight_ratio * 2.3,
            "Healthy leaf": 0.18 + healthy_bonus * 1.55 - lesion_ratio * 0.35,
        }

        if green_ratio > 0.62 and lesion_ratio < 0.08:
            scores["Healthy leaf"] += 0.55

        for label in list(scores):
            if label not in self.labels:
                scores.pop(label)

        return {label: max(score, 0.02) for label, score in scores.items()}

    def extract_affected_zones(self, heatmap: np.ndarray) -> list[str]:
        if heatmap.size == 0:
            return ["mid-leaf region"]

        upsampled = np.array(Image.fromarray(np.uint8(heatmap * 255)).resize((4, 4))) / 255.0
        names = [
            "top-left", "top-center-left", "top-center-right", "top-right",
            "upper-left", "upper-center-left", "upper-center-right", "upper-right",
            "mid-left", "center-left", "center-right", "mid-right",
            "bottom-left", "bottom-center-left", "bottom-center-right", "bottom-right",
        ]
        ranked = np.argsort(upsampled.reshape(-1))[::-1]
        zones = [names[idx] for idx in ranked[:3] if upsampled.reshape(-1)[idx] >= 0.45]
        return zones or ["mid-leaf region"]


model_service = ModelService()
