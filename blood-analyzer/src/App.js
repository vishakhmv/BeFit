import { Link } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="container">
      <nav className="navbar">
        <h1 className="logo">BeFit</h1>
        <div className="nav-links">
          <a href="#">About us</a>
          <a href="#">Help & Support</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-text">
          <h2>
            Master Your Health <br /> with Smart Data.
          </h2>
          <p>
            Turn your blood reports into actionable insights and better
            habits for a healthier life.
          </p>

          <div className="buttons">
            <button className="signup">Sign up</button>
            <Link to="/login" className="login">Log in</Link>
          </div>
        </div>

        <div className="hero-image">
          <img src="/heroimage.jpg" alt="Health" />
        </div>
      </section>
    </div>
  );
}

export default App;
