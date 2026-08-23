import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get("/health");
        setMessage(`Backend: ${response.data.status}`);
      } catch (error) {
        console.error("Backend connection failed:", error);
        setMessage("Backend connection failed");
      }
    };

    checkBackend();
  }, []);

  return (
    <div>
      <h1>Cloud Storage Service</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;