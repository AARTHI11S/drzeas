// src/components/PestDetector.jsx
import React, { useState } from "react";
import TextToSpeech from "./TextToSpeech";

const PestDetector = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [heatmap, setHeatmap] = useState("");
  const [diagnosisText, setDiagnosisText] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const detected = "Stem borer detected. Apply neem oil spray.";
      setImage(reader.result);
      setResult("Stem borer detected");
      setHeatmap("https://i.ibb.co/nCfwsyH/gradcam-example.jpg");
      setDiagnosisText(detected); // Send this to TextToSpeech component
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pest-detector">
      <h2>Pest Diagnosis</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && (
        <>
          <img src={image} alt="Uploaded" className="uploaded-img" />
          <p><strong>Result:</strong> {result}</p>
          {heatmap && (
            <>
              <h3>Grad-CAM Affected Area:</h3>
              <img src={heatmap} alt="GradCAM Heatmap" className="heatmap-img" />
            </>
          )}
          <TextToSpeech text={diagnosisText} />
        </>
      )}
    </div>
  );
};

export default PestDetector;
