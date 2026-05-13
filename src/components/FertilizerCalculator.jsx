import React, { useState } from "react";
//import "./Calculator.css";

const FertilizerCalculator = () => {
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("hectare");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    let N, P, K;
    const a = parseFloat(area);

    if (isNaN(a)) {
      alert("Enter a valid number");
      return;
    }

    if (unit === "hectare") {
      N = a * 120;
      P = a * 60;
      K = a * 40;
    } else {
      N = a * 48.56;  // converted for 1 acre
      P = a * 24.28;
      K = a * 16.19;
    }

    setResult({ N, P, K });
  };

  return (
    <div className="calculator-container">
      <h2>Fertilizer Calculator</h2>
      <input
        type="number"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="Enter area"
      />
      <select value={unit} onChange={(e) => setUnit(e.target.value)}>
        <option value="hectare">Hectare</option>
        <option value="acre">Acre</option>
      </select>
      <button onClick={handleCalculate}>Calculate</button>

      {result && (
        <div className="result-box">
          <p>Nitrogen (N): {result.N.toFixed(2)} kg/{unit === "hectare" ? "ha" : "acre"}</p>
          <p>Phosphorus (P): {result.P.toFixed(2)} kg/{unit === "hectare" ? "ha" : "acre"}</p>
          <p>Potassium (K): {result.K.toFixed(2)} kg/{unit === "hectare" ? "ha" : "acre"}</p>
        </div>
      )}
    </div>
  );
};

export default FertilizerCalculator;
