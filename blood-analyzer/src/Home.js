import "./Home.css";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TodoTracker from "./TodoTracker";

export default function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userData, setUserData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    medicines: "",
  });
  
  useEffect(() => {
  fetch("http://localhost:3000/home", {
    credentials: "include",
  })
    .then(res => {
      if (res.status === 401) {
        navigate("/login");
      }
    })
    .catch(() => navigate("/login"));
  }, []);


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

  // dummy user data (replace with real later)
  formData.append("age", 22);
  formData.append("gender", "male");
  formData.append("height", 175);
  formData.append("weight", 70);
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

    console.log(data); // important: see structure
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
              <h2>Upload Your Blood Report's</h2>
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
                  <input placeholder="Height (cm)"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: e.target.value })}
                  />
                  <input placeholder="Weight (kg)"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: e.target.value })}
                  />
                </div>
                <button className="clear-btn" onClick={clearFiles} disabled={files.length === 0}>Clear Files</button>
                <button className="analyze-btn" onClick={handleAnalyze}>{loading ? "Analyzing..." : "Analyze Report"}</button>
                {result && (<div style={{ marginTop: "20px" }}>
                  <h3>Blood Report Results</h3>
                  {result.results.map((r, i) => (
                    <div key={i} style={{ marginBottom: "10px" }}>
                      <strong>{r.name}</strong> → {r.value} ({r.status})
                      {r.status !== "NORMAL" && (
                        <p>
                          ⚠ {r.issues} <br />
                          Cause: {r.whyItHappens}
                        </p>
                      )}
                    </div>
                  ))}

                  <h3>Water Intake</h3>
                  <p>{result.waterIntakePerDay}</p>

                  <h3>Sleep</h3>
                  <p>{result.minimumSleepHours}</p>
                </div>
              )}
              </div>
            </>
          )}

          {view === "todo" && <TodoTracker />}  {/* ← renders here */}

        </main>
      </div>

      <div className="bot-button">🤖</div>
    </div>
  );
}