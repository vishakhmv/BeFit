import "./Home.css";
import { useState } from "react";
import ChatBot from "./ChatBot";

export default function Home() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
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

      {/* Chatbot Popup */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Robot Icon Button */}
      <div className="bot-button" onClick={toggleChat}>
        <span className="material-icons-outlined">
          {isChatOpen ? "close" : "smart_toy"}
        </span>
      </div>

    </div>
  );
}