import React, { useState } from "react";
//import "./Calculator.css";

const SeedRateCalculator = () => {
  const [area, setArea] = useState("");
  const [unit, setUnit] = useState("hectare");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const a = parseFloat(area);
    if (isNaN(a)) {
      alert("Enter a valid number");
      return;
    }

    let seedRate;
    if (unit === "hectare") {
      seedRate = a * 20; // Example: 20 kg per hectare
    } else {
      seedRate = a * 8.09; // Example: ~8.09 kg per acre
    }

    setResult(seedRate);
  };

  return (
    <div className="calculator-container">
      <h2>Seed Rate Calculator</h2>
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
          <p>Recommended Seed Rate: {result.toFixed(2)} kg/{unit === "hectare" ? "ha" : "acre"}</p>
        </div>
      )}
    </div>
  );
};

export default SeedRateCalculator;
