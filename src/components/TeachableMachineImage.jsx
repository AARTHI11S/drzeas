// TeachableMachineImage.jsx
import React, { useRef, useState } from "react";
import "@tensorflow/tfjs";
import * as tmImage from "@teachablemachine/image";
import "../styles/TeachableMachineImage.css";

const TeachableMachineImage = () => {
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const imgRef = useRef();

  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/OGr5ryjeW/";

  const loadModel = async () => {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";
    const loadedModel = await tmImage.load(modelURL, metadataURL);
    setModel(loadedModel);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      imgRef.current.src = reader.result;
      setLoading(true);
      setPrediction("Analyzing...");
      if (!model) {
        await loadModel();
      }
      setTimeout(() => classifyImage(), 500); // slight delay to render image
    };
    reader.readAsDataURL(file);
  };

  const classifyImage = async () => {
    const prediction = await model.predict(imgRef.current);
    const best = prediction.reduce((a, b) => (a.probability > b.probability ? a : b));
    setPrediction(`${best.className} (${(best.probability * 100).toFixed(2)}%)`);
    setLoading(false);
  };

  return (
    <div className="scanner-container">
      <h2>📷 Pest Detector</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <div className="image-preview">
        <img ref={imgRef} alt="Upload preview" />
      </div>
      <div className="result">
        {loading ? <p>Analyzing...</p> : <p>🧠 Result: {prediction}</p>}
      </div>
    </div>
  );
};

export default TeachableMachineImage;
