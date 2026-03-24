import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
    const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

    if (!res.ok) {
        alert("Invalid credentials");
        return;
      }

    const data = await res.json();
    console.log(data);

    navigate("/home");
    } catch (err) {
      console.error(err);
    }
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
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
        <button className="final-login" onClick={handleLogin}>Log in</button>
      </div>
      <div className="hero-image">
        <img src="/heroimage.jpg" alt="Health" />
      </div>
    </div>
    </>
  );
}