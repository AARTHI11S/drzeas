import React from "react";

const PestInfo = ({ resultText }) => {
  return (
    <div className="pest-info-box">
      <h3>Diagnosis Result:</h3>
      <p>{resultText}</p>
    </div>
  );
};

export default PestInfo;
