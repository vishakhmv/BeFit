import "./Home.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TodoTracker from "./TodoTracker";
import ChatBot from "./ChatBot";
import Profile from "./Profile";

export default function Home() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [view, setView] = useState("dashboard");
  const [dashboardTab, setDashboardTab] = useState("overview");

  // Your ChatBot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  //profile state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Teammate's Upload & Auth state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [userData, setUserData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
  });

  // Teammate's Auth Check
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const authRes = await fetch("http://localhost:5000/home", {
          credentials: "include",
        });
        if (authRes.status === 401) return navigate("/login");

        const analysisRes = await fetch("http://localhost:5000/get-analysis", {
          credentials: "include",
        });
        if (analysisRes.status === 200) {
          const data = await analysisRes.json();
          setResult(data);
        }
      } catch (err) {
        navigate("/login");
      }
    };

    fetchInitialData();
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

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!data || !Array.isArray(data.results)) {
        console.error("❌ Invalid response from server:", data);
        alert(data?.message || "Analysis failed. The report could not be read. Please try a clearer image.");
        setLoading(false);
        return;
      }

      setResult(data);
      console.log("✅ Analysis complete and fully saved to database!");
    } catch (err) {
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
        <div
          className="nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <span
            onClick={() => setIsProfileOpen(true)}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            title="Profile"
          >
            <svg viewBox="0 0 32 32" width="38" height="38">
              <circle cx="16" cy="16" r="16" fill="#2c5f63" />
              <circle cx="16" cy="12" r="5" fill="rgba(255,255,255,0.9)" />
              <ellipse
                cx="16"
                cy="26"
                rx="9"
                ry="6"
                fill="rgba(255,255,255,0.9)"
              />
            </svg>
          </span>
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
                  <h2 class="section-title-h2">Upload Your Blood Report</h2>
                  <div className="card">
                    <div
                      className="upload-box"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      <label className="drop-zone">
                        <span>Drop Report here, or click to upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                      <ul className="preview">
                        {files.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                     
  <input
    style={{ width: "26rem", display: "block", margin: "0 auto 1rem auto" }}
    placeholder="Height (cm)"
    value={userData.height}
    onChange={(e) =>
      setUserData({ ...userData, height: e.target.value })
    }
  />
  <input
    style={{ width: "26rem", display: "block", margin: "0 auto 1rem auto" }}
    placeholder="Weight (kg)"
    value={userData.weight}
    onChange={(e) =>
      setUserData({ ...userData, weight: e.target.value })
    }
  />
                    </div>

                    <button
                      className="clear-btn"
                      onClick={clearFiles}
                      disabled={files.length === 0}
                    >
                      Clear Files
                    </button>
                    <button className="analyze-btn" onClick={handleAnalyze}>
                      {loading ? "Analyzing..." : "Analyze Report"}
                    </button>
                  </div>
                </div>
              )}

              {/* IF RESULT EXISTS: SHOW DASHBOARD WITH TABS */}
              {result && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <h2>Your AI Health Analysis</h2>
                    <button
                      className="clear-btn"
                      onClick={() => {
                        setResult(null);
                        clearFiles();
                      }}
                    >
                      Upload New Report
                    </button>
                  </div>

                  {/* --- THE TABS --- */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "15px",
                      borderBottom: "2px solid #e0e0e0",
                      paddingBottom: "10px",
                    }}
                  >
                    <button
                      onClick={() => setDashboardTab("overview")}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "0.2s",
                        backgroundColor:
                          dashboardTab === "overview"
                            ? "#2c5f63"
                            : "transparent",
                        color: dashboardTab === "overview" ? "white" : "#666",
                      }}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setDashboardTab("summary")}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold",
                        transition: "0.2s",
                        backgroundColor:
                          dashboardTab === "summary"
                            ? "#2c5f63"
                            : "transparent",
                        color: dashboardTab === "summary" ? "white" : "#666",
                      }}
                    >
                      Summary
                    </button>
                  </div>

                  {/* --- THE WINDOW BOX --- */}
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "20px",
                      borderRadius: "12px",
                      border: "1px solid #ddd",
                      height: "60vh",
                      overflowY: "auto",
                    }}
                  >
                    {/* IF ON OVERVIEW TAB -> SHOW THE BOXES */}
                    {dashboardTab === "overview" && (
                      <div
                        className="results-grid"
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(220px, 1fr))",
                          gap: "15px",
                        }}
                      >
                        {[...result.results]
                          .sort((a, b) => {
                            if (
                              a.status !== "NORMAL" &&
                              a.status !== "UNKNOWN" &&
                              (b.status === "NORMAL" || b.status === "UNKNOWN")
                            )
                              return -1;
                            if (
                              (a.status === "NORMAL" ||
                                a.status === "UNKNOWN") &&
                              b.status !== "NORMAL" &&
                              b.status !== "UNKNOWN"
                            )
                              return 1;
                            return 0;
                          })
                          .map((r, i) => (
                            <div
                              key={i}
                              className="result-card"
                              style={{
                                padding: "12px",
                                fontSize: "0.9rem",
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                              }}
                            >
                              <div
                                className="card-header"
                                style={{ marginBottom: "8px" }}
                              >
                                <strong style={{ fontSize: "0.95rem" }}>
                                  {r.name}
                                </strong>
                                <span
                                  className={getBadgeClass(r.status)}
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "3px 6px",
                                  }}
                                >
                                  {r.status}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "1.1rem",
                                  fontWeight: "bold",
                                  marginBottom: "8px",
                                }}
                              >
                                {r.value}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  flexGrow: 1,
                                }}
                              >
                                {r.status !== "NORMAL" &&
                                  r.status !== "UNKNOWN" && (
                                    <div
                                      className="warning-text"
                                      style={{
                                        marginBottom: "10px",
                                        padding: "8px",
                                        backgroundColor: "#ffebee",
                                        borderRadius: "5px",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      <strong>⚠ Note:</strong> {r.issues} <br />
                                      <strong>Cause:</strong> {r.whyItHappens}
                                    </div>
                                  )}

                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "black",
                                    marginTop: "auto",
                                  }}
                                >
                                  {r.summary && (
                                    <p style={{ marginBottom: "6px" }}>
                                      <strong>Summary:</strong> {r.summary}
                                    </p>
                                  )}
                                  {r.status === "NORMAL" && r.whatIfLow && (
                                    <p
                                      style={{
                                        marginBottom: "2px",
                                        color: "#555",
                                      }}
                                    >
                                      <em>↓ If Low: {r.whatIfLow}</em>
                                    </p>
                                  )}
                                  {r.status === "NORMAL" && r.whatIfHigh && (
                                    <p style={{ margin: 0, color: "#555" }}>
                                      <em>↑ If High: {r.whatIfHigh}</em>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* SUMMARY TAB CONTENT: HOLISTIC ACTION PLAN */}
                    {dashboardTab === "summary" && (
                      <div
                        style={{
                          padding: "10px",
                          fontSize: "1.05rem",
                          lineHeight: "1.6",
                          color: "#333",
                        }}
                      >
                        {/* If the AI generated the new Executive Summary, show the beautiful layout! */}
                        {result.executiveSummary ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "20px",
                            }}
                          >
                            {/* 1. Future Outlook Box */}
                            <div
                              style={{
                                backgroundColor: "#e0f2f1",
                                padding: "20px",
                                borderRadius: "10px",
                                borderLeft: "5px solid #00897b",
                              }}
                            >
                              <h3
                                style={{
                                  margin: "0 0 10px 0",
                                  color: "#00695c",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span className="material-icons-outlined">
                                  psychology_alt
                                </span>
                                Future Outlook
                              </h3>
                              <p style={{ margin: 0, fontSize: "1rem" }}>
                                {result.executiveSummary.futureOutlook}
                              </p>
                            </div>

                            {/* 2. Key Focus Areas */}
                            {result.executiveSummary.keyFocusAreas &&
                              result.executiveSummary.keyFocusAreas.length >
                                0 && (
                                <div>
                                  <h4
                                    style={{
                                      color: "#2c5f63",
                                      marginBottom: "10px",
                                    }}
                                  >
                                    🎯 Key Areas to Fix:
                                  </h4>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "10px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {result.executiveSummary.keyFocusAreas.map(
                                      (area, idx) => (
                                        <span
                                          key={idx}
                                          style={{
                                            backgroundColor: "#ffebee",
                                            color: "#c62828",
                                            padding: "8px 15px",
                                            borderRadius: "20px",
                                            fontSize: "0.9rem",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {area}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* 3. Nutrition & Lifestyle Grid */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "15px",
                              }}
                            >
                              {/* Nutrition Card */}
                              <div
                                style={{
                                  backgroundColor: "#fff3e0",
                                  padding: "20px",
                                  borderRadius: "10px",
                                  borderLeft: "5px solid #fb8c00",
                                }}
                              >
                                <h4
                                  style={{
                                    margin: "0 0 15px 0",
                                    color: "#e65100",
                                  }}
                                >
                                  🥗 Nutrition Targets
                                </h4>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "15px",
                                    marginBottom: "15px",
                                  }}
                                >
                                  <div
                                    style={{
                                      backgroundColor: "white",
                                      padding: "10px",
                                      borderRadius: "8px",
                                      flex: 1,
                                      textAlign: "center",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        display: "block",
                                        fontSize: "0.8rem",
                                        color: "#666",
                                      }}
                                    >
                                      CALORIES
                                    </strong>
                                    <span
                                      style={{
                                        fontSize: "1.2rem",
                                        fontWeight: "bold",
                                        color: "#fb8c00",
                                      }}
                                    >
                                      {
                                        result.executiveSummary
                                          .estimatedCalories
                                      }
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      backgroundColor: "white",
                                      padding: "10px",
                                      borderRadius: "8px",
                                      flex: 1,
                                      textAlign: "center",
                                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        display: "block",
                                        fontSize: "0.8rem",
                                        color: "#666",
                                      }}
                                    >
                                      PROTEIN
                                    </strong>
                                    <span
                                      style={{
                                        fontSize: "1.2rem",
                                        fontWeight: "bold",
                                        color: "#fb8c00",
                                      }}
                                    >
                                      {result.executiveSummary.estimatedProtein}
                                    </span>
                                  </div>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                  {result.executiveSummary.dietaryFocus}
                                </p>
                                <p
                                  style={{
                                    margin: "10px 0 0 0",
                                    fontSize: "0.8rem",
                                    fontStyle: "italic",
                                    color: "#666",
                                  }}
                                >
                                  *Your personalized meal plan has been
                                  generated based on these targets.*
                                </p>
                              </div>

                              {/* Lifestyle Card */}
                              <div
                                style={{
                                  backgroundColor: "#e8eaf6",
                                  padding: "20px",
                                  borderRadius: "10px",
                                  borderLeft: "5px solid #3f51b5",
                                }}
                              >
                                <h4
                                  style={{
                                    margin: "0 0 10px 0",
                                    color: "#283593",
                                  }}
                                >
                                  🏃 Lifestyle & Recovery
                                </h4>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                  {result.executiveSummary.lifestyleAdvice}
                                </p>
                                <p
                                  style={{
                                    margin: "10px 0 0 0",
                                    fontSize: "0.8rem",
                                    fontStyle: "italic",
                                    color: "#666",
                                  }}
                                >
                                  *Check the Todo Tracker for your daily
                                  routines.*
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Fallback
                          <p>
                            {result.overallSummary ||
                              "Waiting for summary generation..."}
                          </p>
                        )}

                        {/* Water & Sleep Trackers */}
                        <div
                          className="results-grid"
                          style={{ marginTop: "30px" }}
                        >
                          <div
                            className="result-card"
                            style={{ borderLeft: "5px solid #0288d1" }}
                          >
                            <h4>💧 Daily Water Goal</h4>
                            <h2 style={{ marginTop: "5px" }}>
                              {result.waterIntakePerDay}
                            </h2>
                          </div>
                          <div
                            className="result-card"
                            style={{ borderLeft: "5px solid #512da8" }}
                          >
                            <h4>💤 Minimum Sleep</h4>
                            <h2 style={{ marginTop: "5px" }}>
                              {result.minimumSleepHours}
                            </h2>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {view === "todo" && <TodoTracker />}
        </main>
      </div>

      <Profile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <ChatBot isOpen={isChatOpen} onClose={toggleChat} />

      <div
        className="bot-button"
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          backgroundColor: "#2c5f63",
          color: "white",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        <span className="material-icons-outlined">
          {isChatOpen ? "close" : "smart_toy"}
        </span>
      </div>
    </div>
  );
}
