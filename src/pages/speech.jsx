import { useState } from "react";

function Mic() {
  const [text, setText] = useState("");

  const start = () => {
    const recognition =
      new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.start();

    recognition.onresult = (e) => {
      setText(e.results[0][0].transcript);
    };
  };

  return (
    <div>
      <button onClick={start}>Start Mic</button>
      <p>{text}</p>
    </div>
  );
}

export default Mic;  