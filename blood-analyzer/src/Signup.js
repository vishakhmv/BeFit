import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const [form, setForm] = useState({
  name: "",
  email: "",
  dob: "",
  password: "",
});
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
    const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message);
        return;
    }

    navigate("/home");
    }catch (err) {
      console.error(err);
    }
  }
  return (
    <>
    <nav className="navbar">
        <h1 className="logo">BeFit</h1>
    </nav>
      <div className="signup-container">
        <div className="signup-form">
          <h2>Create an Account</h2>
          <p>Start your health journey today</p>

          <input type="text" placeholder="Full Name" onChange={(e) => setForm({...form, name: e.target.value})}/>
          <input type="email" placeholder="Email" onChange={(e) => setForm({...form, email: e.target.value})}/>
          <input type="dob" placeholder="D.O.B" onChange={(e) => setForm({...form, dob: e.target.value})}/>
          <input type="password" placeholder="Password" onChange={(e) => setForm({...form, password: e.target.value})}/>
          <input type="password" placeholder="Confirm password" />
          <button onClick={handleSignup}>Create account</button>
        </div>

        <div className="hero-image">
          <img src="/heroimage.jpg" alt="Signup" />
        </div>
      </div>
    </>
  );
}
