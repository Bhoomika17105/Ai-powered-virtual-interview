import { useEffect, useRef } from "react";

function Camera() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.log("Camera error:", err));
  }, []);

  return <video ref={videoRef} autoPlay />;
}

export default Camera;  