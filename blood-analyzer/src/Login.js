import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    //hey vishak, here's where u can add the authentication logic for logging in
    navigate("/home");
  }
  return (
    <>
    <nav className="navbar">
      <h1 className="logo">BeFit</h1>
    </nav>
    <div className="login-container">
      <div className="login-form">
        <h2>Welcome back...</h2>
        <p>Enter your details below</p>
        <input placeholder="Email"/>
        <input placeholder="Password"/>
        <button className="final-login" onClick={handleLogin}>Log in</button>
      </div>
      <div className="hero-image">
        <img src="/heroimage.jpg" alt="Health" />
      </div>
    </div>
    </>
  );
}