import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function App() {
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();

  const goToLogin = () => {
    setExiting(true);
    setTimeout(() => navigate("/login"), 500); // 0.5s
  };

  return (
    <>
    <nav className="navbar">
      <h1 className="logo">BeFit</h1>
    </nav>
    <div className={`container ${exiting ? "exit" : ""}`}>
      <section className="hero">
        <div className="hero-text">
          <h2>Master Your Health <br /> with Smart Data.</h2>
          <p>Turn your blood reports into actionable insights and better
            habits for a healthier life.</p>

          <button className="signup">
            Sign up
          </button>
          <button className="login" onClick={goToLogin}>
            Log in
          </button>
        </div>

        <div className="hero-image">
          <img src="/heroimage.jpg" alt="Health" />
        </div>
      </section>
    </div>
    </>
  );
}