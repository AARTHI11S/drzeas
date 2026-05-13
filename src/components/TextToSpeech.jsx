import React from "react";

const TextToSpeech = ({ text }) => {
  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div>
      <button onClick={handleSpeak}>🔊 Listen</button>
    </div>
  );
};

export default TextToSpeech;
