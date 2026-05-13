import React, { useEffect, useState } from "react";
import "../styles/WeatherSection.css";

const WeatherSection = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=5978924d09e8490e90d165041252807&q=auto:ip`

      );
      const data = await res.json();
      setWeather(data);
    };
    fetchWeather();
  }, []);

  return (
    <div className="weather-container">
      <h2>☀️ Current Weather</h2>
      {weather ? (
        <div>
          <p><strong>Location:</strong> {weather.location.name}</p>
          <p><strong>Temperature:</strong> {weather.current.temp_c}°C</p>
          <p><strong>Humidity:</strong> {weather.current.humidity}%</p>
          <p><strong>Condition:</strong> {weather.current.condition.text}</p>
        </div>
      ) : (
        <p>Loading weather data...</p>
      )}
    </div>
  );
};

export default WeatherSection;