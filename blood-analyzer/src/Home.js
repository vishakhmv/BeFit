import "./Home.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TodoTracker from "./TodoTracker";
import ChatBot from "./ChatBot";

export default function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("dashboard");
  
  // Your ChatBot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Teammate's Upload & Auth state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userData, setUserData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    medicines: "",
  });

  // Teammate's Auth Check
  useEffect(() => {
    fetch("http://localhost:3000/home", {
      credentials: "include",
    })
      .then((res) => {
        if (res.status === 401) {
          navigate("/login");
        }
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const toggleChat = () => setIsChatOpen((prev) => !prev);
  const clearFiles = () => setFiles([]);

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return alert("Upload a file first");

    const formData = new FormData();
    formData.append("report", files[0]);
    formData.append("height", userData.height);
    formData.append("weight", userData.weight);
    formData.append("age", 22);
    formData.append("gender", "male");
    formData.append("medicines", "none");

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      setResult(data);
      await fetch("http://localhost:5000/save-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      console.log("✅ Plan successfully saved to database!");    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function for the color badges
  const getBadgeClass = (status) => {
    if (status === "NORMAL") return "badge normal";
    if (status === "LOW") return "badge low";
    if (status === "HIGH") return "badge high";
    return "badge unknown";
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <h1 className="logo">BeFit</h1>
        <div className="nav-links">
          <span>About us</span>
          <span>Help & Support</span>
          <span>Profile</span>
        </div>
      </nav>

      <div className="home-body">
        <aside className="sidebar">
          <div
            className={`sidebar-item ${view === "dashboard" ? "active" : ""}`}
            onClick={() => setView("dashboard")}
            style={{ cursor: "pointer" }}
          >
            Dashboard
          </div>
          <div
            className={`sidebar-item ${view === "todo" ? "active" : ""}`}
            onClick={() => setView("todo")}
            style={{ cursor: "pointer" }}
          >
            Todo Tracker
          </div>
        </aside>
        
        <main className="main-content">
          {view === "dashboard" && (
            <>
              {/* IF NO RESULT: SHOW UPLOAD BOX */}
              {!result && (
                <div>
                  <h2>Upload Your Blood Report</h2>
                  <div className="card">
                    <div className="upload-box" onDrop={handleDrop} onDragOver={handleDragOver}>
                      <label className="drop-zone">
                        <span>Drop Report here, or click to upload</span>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
                      </label>
                      <ul className="preview">
                        {files.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <input placeholder="Height (cm)" value={userData.height} onChange={(e) => setUserData({ ...userData, height: e.target.value })} />
                      <input placeholder="Weight (kg)" value={userData.weight} onChange={(e) => setUserData({ ...userData, weight: e.target.value })} />
                    </div>
                    
                    <button className="clear-btn" onClick={clearFiles} disabled={files.length === 0}>Clear Files</button>
                    <button className="analyze-btn" onClick={handleAnalyze}>
                      {loading ? "Analyzing..." : "Analyze Report"}
                    </button>
                  </div>
                </div>
              )}

              {/* IF RESULT EXISTS: HIDE UPLOAD AND SHOW DASHBOARD */}
              {result && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Your AI Health Analysis</h2>
                    <button className="clear-btn" onClick={() => {setResult(null); clearFiles();}}>
                      Upload New Report
                    </button>
                  </div>
                  
                  <div className="results-grid">
                    {result.results.map((r, i) => (
                      <div key={i} className="result-card">
                        <div className="card-header">
                          <strong>{r.name}</strong>
                          <span className={getBadgeClass(r.status)}>{r.status}</span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                          {r.value}
                        </div>
                        {r.status !== "NORMAL" && (
                          <div className="warning-text">
                            <strong>⚠ Note:</strong> {r.issues} <br />
                            <strong>Cause:</strong> {r.whyItHappens}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="results-grid" style={{ marginTop: '30px' }}>
                     <div className="result-card" style={{ borderLeft: '5px solid #0288d1' }}>
                        <h3>💧 Daily Water Goal</h3>
                        <h2>{result.waterIntakePerDay}</h2>
                     </div>
                     <div className="result-card" style={{ borderLeft: '5px solid #512da8' }}>
                        <h3>💤 Minimum Sleep</h3>
                        <h2>{result.minimumSleepHours}</h2>
                     </div>
                  </div>
                </div>
              )}
            </>
          )}

          {view === "todo" && <TodoTracker />}
        </main>
      </div>

      <ChatBot isOpen={isChatOpen} onClose={toggleChat} />

      <div className="bot-button" onClick={toggleChat} style={{
          position: "fixed", bottom: "20px", right: "20px", width: "60px", height: "60px", backgroundColor: "#2c5f63", color: "white", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 1000
      }}>
        <span className="material-icons-outlined">
          {isChatOpen ? "close" : "smart_toy"}
        </span>
      </div>
    </div>
  );
}