# DR.ZEA MAIZE

DR.ZEA MAIZE is a full-stack maize disease analysis project with:

- React frontend for image upload and camera capture
- FastAPI backend for prediction and recommendations
- MobileNetV2 training pipeline
- Explainable AI outputs using Grad-CAM and LIME

## Project Layout

```text
drzeas/
  backend/
    app.py
    model_service.py
    recommendations.py
    requirements.txt
    models/
  public/
    model/                 # existing browser fallback model
  src/
    services/analyzeApi.js
    App.jsx
  training/
    train_mobilenetv2.py
    dataset_structure.md
```

## 1. Dataset Placement

Keep your dataset anywhere on your machine. The training script supports:

- `train / val / test` split folders
- or one root folder with class subfolders

Example:

```text
D:\maize-dataset\
  train\
    Healthy leaf\
    Common_rust\
    Gray_leaf_spot\
  val\
    Healthy leaf\
    Common_rust\
    Gray_leaf_spot\
  test\
    Healthy leaf\
    Common_rust\
    Gray_leaf_spot\
```

See [dataset_structure.md](C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas\training\dataset_structure.md).

## 2. Train MobileNetV2

Create a Python virtual environment inside [backend](C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas\backend):

```powershell
cd C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run training from the project root:

```powershell
cd C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas
python training\train_mobilenetv2.py --dataset-dir "D:\maize-dataset" --output-dir "backend\models"
```

The script saves:

- `backend/models/drzea_maize_mobilenetv2.keras`
- `backend/models/labels.json`
- `backend/models/training_history.json`

## 3. Run Backend API

After training:

```powershell
cd C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas\backend
.venv\Scripts\activate
uvicorn app:app --reload
```

Default backend URL:

- [http://127.0.0.1:8000](http://127.0.0.1:8000)

Health endpoint:

- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## 4. Run Frontend

```powershell
cd C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas
npm run dev
```

Frontend URL is usually:

- [http://localhost:5173](http://localhost:5173)

If the backend is running, the frontend will use:

- real backend prediction
- Grad-CAM heatmap
- LIME explanation
- agritech recommendation

If backend is not running, the app falls back to the existing browser-side Teachable Machine model in [public/model](C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas\public\model).

## 5. Novelty Flow

Your intended novelty pipeline is now supported like this:

1. Upload maize leaf image
2. MobileNetV2 predicts disease class
3. DR.ZEA MAIZE shows confidence and disease name
4. Grad-CAM highlights affected leaf region
5. LIME explains important image regions
6. Agritech-linked recommendation is shown for the predicted disease

## 6. Important Note

Your frontend is ready now, but your final production accuracy depends on:

- dataset quality
- correct class balance
- strong train/validation split
- trained MobileNetV2 model saved into `backend/models`

## 7. Next Practical Step

Place your dataset and run this command by replacing the dataset path:

```powershell
cd C:\Users\ssaar\OneDrive\Desktop\drzeas\drzeas
python training\train_mobilenetv2.py --dataset-dir "YOUR_DATASET_PATH" --output-dir "backend\models"
```
