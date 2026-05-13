import React, { useState, useEffect } from "react";

function LanguageToggle() {
  const [language, setLanguage] = useState(localStorage.getItem("lang") || "en");

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ta" : "en";
    setLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  return (
    <button onClick={toggleLanguage} className="lang-toggle">
      {language === "en" ? "தமிழ்" : "English"}
    </button>
  );
}

export default LanguageToggle;