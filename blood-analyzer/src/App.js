import { useState } from "react";
import "./App.css";

function App() {
  const [Login , setLogin] = useState(false);
  return (
    <div className="container">
      <nav className="navbar">
        <h1 className="logo">BeFit</h1>
        <div className="nav-links">
          <a href="#">About us</a>
          <a href="#">Help & Support</a>
        </div>
      </nav>

       <section className={`hero ${Login ? "slide-left" : ""}`}>
        <div className={`hero-text ${Login ? "hide" : ""}`}>
          <h2>
            Master Your Health <br /> with Smart Data.
          </h2>
          <p>
            Turn your blood reports into actionable insights and better
            habits for a healthier life.
          </p>

          <div className="buttons">
            <button className="signup">Sign up</button>
            <button className="login" onClick={() => setLogin(true)}>
              Log in
            </button>
          </div>
        </div>

        <div className={`login-hero-text ${Login ? "show" : ""}`}>
          <h2>Welcome back...</h2>
          <p>Enter your details to access your health data.</p>

          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button className="login-btn">Log in</button>
        </div>

        <div className="hero-image">
          <img
            src={Login ? "/loginheroimage.jpg" : "/heroimage.jpg"}
            alt="Health"
          />
        </div>
      </section>
    </div>
  );
}

export default App;
