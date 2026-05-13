from __future__ import annotations

import argparse
import json
from pathlib import Path

import tensorflow as tf


AUTOTUNE = tf.data.AUTOTUNE
IMAGE_SIZE = (224, 224)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train DR.ZEA MAIZE MobileNetV2 model.")
    parser.add_argument("--dataset-dir", required=True, help="Path to dataset root.")
    parser.add_argument("--output-dir", default="backend/models", help="Directory to save trained model.")
    parser.add_argument("--epochs-head", type=int, default=8, help="Epochs with frozen backbone.")
    parser.add_argument("--epochs-finetune", type=int, default=8, help="Fine-tuning epochs.")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size.")
    parser.add_argument("--learning-rate", type=float, default=1e-3, help="Head training learning rate.")
    parser.add_argument("--fine-tune-learning-rate", type=float, default=1e-5, help="Fine-tuning learning rate.")
    parser.add_argument("--validation-split", type=float, default=0.2, help="Validation split if val folder is absent.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    return parser.parse_args()


def has_split_dirs(dataset_dir: Path) -> bool:
    return all((dataset_dir / part).exists() for part in ("train", "val"))


def prepare_dataset(dataset_dir: Path, batch_size: int, validation_split: float, seed: int):
    if has_split_dirs(dataset_dir):
        train_ds = tf.keras.utils.image_dataset_from_directory(
            dataset_dir / "train",
            image_size=IMAGE_SIZE,
            batch_size=batch_size,
            label_mode="int",
            shuffle=True,
            seed=seed,
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            dataset_dir / "val",
            image_size=IMAGE_SIZE,
            batch_size=batch_size,
            label_mode="int",
            shuffle=False,
        )
        test_dir = dataset_dir / "test"
        test_ds = (
            tf.keras.utils.image_dataset_from_directory(
                test_dir,
                image_size=IMAGE_SIZE,
                batch_size=batch_size,
                label_mode="int",
                shuffle=False,
            )
            if test_dir.exists()
            else None
        )
    else:
        train_ds = tf.keras.utils.image_dataset_from_directory(
            dataset_dir,
            validation_split=validation_split,
            subset="training",
            seed=seed,
            image_size=IMAGE_SIZE,
            batch_size=batch_size,
            label_mode="int",
        )
        val_ds = tf.keras.utils.image_dataset_from_directory(
            dataset_dir,
            validation_split=validation_split,
            subset="validation",
            seed=seed,
            image_size=IMAGE_SIZE,
            batch_size=batch_size,
            label_mode="int",
        )
        test_ds = None

    class_names = train_ds.class_names
    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.12),
            tf.keras.layers.RandomContrast(0.12),
        ],
        name="augmentation",
    )

    def preprocess_train(images, labels):
        images = augmentation(images)
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    def preprocess_eval(images, labels):
        images = tf.keras.applications.mobilenet_v2.preprocess_input(images)
        return images, labels

    train_ds = train_ds.map(preprocess_train, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    val_ds = val_ds.map(preprocess_eval, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)
    if test_ds is not None:
        test_ds = test_ds.map(preprocess_eval, num_parallel_calls=AUTOTUNE).prefetch(AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names


def build_model(num_classes: int) -> tuple[tf.keras.Model, tf.keras.Model]:
    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    backbone = tf.keras.applications.MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    backbone.trainable = False

    x = backbone(inputs, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs, name="drzea_maize_mobilenetv2")
    return model, backbone


def compile_model(model: tf.keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )


def train() -> None:
    args = parse_args()
    dataset_dir = Path(args.dataset_dir).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    train_ds, val_ds, test_ds, class_names = prepare_dataset(
        dataset_dir=dataset_dir,
        batch_size=args.batch_size,
        validation_split=args.validation_split,
        seed=args.seed,
    )

    model, backbone = build_model(num_classes=len(class_names))

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", patience=2, factor=0.3),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(output_dir / "drzea_maize_mobilenetv2.keras"),
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]

    compile_model(model, args.learning_rate)
    head_history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_head,
        callbacks=callbacks,
    )

    backbone.trainable = True
    for layer in backbone.layers[:-40]:
        layer.trainable = False

    compile_model(model, args.fine_tune_learning_rate)
    fine_tune_history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs_head + args.epochs_finetune,
        initial_epoch=head_history.epoch[-1] + 1,
        callbacks=callbacks,
    )

    metrics = model.evaluate(val_ds, return_dict=True, verbose=0)
    if test_ds is not None:
        metrics["test"] = model.evaluate(test_ds, return_dict=True, verbose=0)

    (output_dir / "labels.json").write_text(json.dumps(class_names, indent=2), encoding="utf-8")
    (output_dir / "training_history.json").write_text(
        json.dumps(
            {
                "head": head_history.history,
                "fine_tune": fine_tune_history.history,
                "validation_metrics": metrics,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print("Training complete.")
    print(f"Classes: {class_names}")
    print(f"Model saved to: {output_dir / 'drzea_maize_mobilenetv2.keras'}")
    print(f"Labels saved to: {output_dir / 'labels.json'}")
    print(f"Validation metrics: {metrics}")


if __name__ == "__main__":
    train()
