import React, { useState, useRef } from "react";
import * as tmImage from "@teachablemachine/image";

const UploadImage = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const imageRef = useRef();
  const modelURL = "model/";

  let model;

  const loadModel = async () => {
    model = await tmImage.load(modelURL + "model.json", modelURL + "metadata.json");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const imageURL = URL.createObjectURL(file);
    setImagePreview(imageURL);
    setLoading(true);

    if (!model) {
      await loadModel();
    }

    setTimeout(async () => {
      const prediction = await model.predict(imageRef.current);
      const highest = prediction.reduce((prev, curr) => (prev.probability > curr.probability ? prev : curr));
      setPrediction(highest);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="text-center my-5">
      <h2>Dr.Zeas - UploadImage</h2>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {imagePreview && (
        <>
          <img
            src={imagePreview}
            alt="Uploaded Leaf"
            ref={imageRef}
            crossOrigin="anonymous"
            className="my-3 rounded"
            width="300"
          />
          {loading ? (
            <button className="btn btn-secondary" disabled>Analyzing...</button>
          ) : prediction ? (
            <div>
              <h4>Prediction: {prediction.className}</h4>
              <p>Confidence: {(prediction.probability * 100).toFixed(2)}%</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default UploadImage;
