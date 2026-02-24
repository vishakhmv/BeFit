import "./Home.css";
import { useState } from "react";

export default function Home() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

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
          <div className="sidebar-item active">Dashboard</div>
          <div className="sidebar-item">Todo Tracker</div>
        </aside>

        <main className="main-content">
        <h2>Upload Your Blood Report</h2>

        <div className="card">

            <div className="upload-section">
                <div className="upload-box">
                    <div className="upload-inner">
                        <p className="upload-title">Upload Image</p>
                        <p className="upload-sub">Drag and drop image here</p>
                    </div>
                </div>
                <button className="upload-btn">Upload Images</button>
            </div>

            <button className="analyze-btn">
            Analyze Report & Get Suggestions
            </button>

        </div>
        </main>
    </div>

      <div className="bot-button">🤖</div>

    </div>
  );
}