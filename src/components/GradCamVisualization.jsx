import React from "react";

function GradCamVisualization() {
  return (
    <div className="gradcam-section">
      <h2>Grad-CAM Affected Area</h2>
      <img
        src="/gradcam-sample.png"
        alt="Highlighted Affected Area"
        className="gradcam-image"
      />
    </div>
  );
}

export default GradCamVisualization;