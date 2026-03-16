import "./Home.css";
import { useState } from "react";
import TodoTracker from "./TodoTracker";  

export default function Home() {
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("dashboard");  

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
                <button className="clear-btn" onClick={clearFiles} disabled={files.length === 0}>Clear Files</button>
                <button className="analyze-btn">Analyze Report & Get Suggestion's</button>
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