// src/components/CropInfo.jsx
import React from 'react';
import "../styles/CropInfo.css";


const CropInfo = () => {
  return (
    <div className="crop-info">
      <h2>More About Maize Crop</h2>
      <p>Maize is one of the most widely grown cereal crops in the world. It requires well-drained soil with good fertility. The crop typically needs warm temperatures and consistent moisture for good yields.</p>
      <ul>
        <li><strong>Ideal Temperature:</strong> 20°C to 30°C</li>
        <li><strong>Soil pH:</strong> 6.0 to 7.5</li>
        <li><strong>Rainfall:</strong> 500–800 mm during the growing season</li>
        <li><strong>Lifecycle:</strong> ~90 to 120 days depending on the variety</li>
      </ul>
    </div>
  );
};

export default CropInfo;
