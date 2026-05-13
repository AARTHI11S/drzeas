from __future__ import annotations

import io

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from model_service import MODEL_PATH, LABELS_PATH, model_service

app = FastAPI(title="DR.ZEA MAIZE API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "model_ready": model_service.ready(),
        "model_path": str(MODEL_PATH),
        "labels_path": str(LABELS_PATH),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    if not model_service.ready():
        raise HTTPException(
            status_code=503,
            detail="Model not ready. Train the MobileNetV2 model and place it in backend/models first.",
        )

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a valid image file.")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return model_service.predict(image)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
