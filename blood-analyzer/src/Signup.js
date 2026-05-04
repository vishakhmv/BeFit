import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const foodPreferences = ["Veg", "Non-Veg"];
  const [food, setPreference] = useState("");
  const [state, setState] = useState("");
  const indianStates = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, dob, whatsapp, food, state, password}),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/home");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to server. Is the backend running?");
    }
  };

  return (
    <>
    <nav className="navbar">
        <h1 className="logo">BeFit</h1>
    </nav>
      <div className="signup-container">
        <div className="signup-form">
          <h2>Create an Account</h2>
          <p>Start your health journey today</p>

          {error && <p style={{color: "red", fontSize: "14px"}}>{error}</p>}

          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="date" 
            placeholder="D.O.B" 
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="WhatsApp Number (10 digits)" 
            value={whatsapp} 
            onChange={(e) => setWhatsapp(e.target.value)} 
            maxLength="10" 
            required 
          />
          <select value={food} onChange={(e) => setPreference(e.target.value)}>
            <option value="">Select Food Preference</option>
            {foodPreferences.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select State</option>
            {indianStates.map((state, index) => (
              <option key={index} value={state}>
                {state}
              </option>
            ))}
          </select>
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Confirm password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={handleSignup}>Create account</button>
        </div>

        <div className="hero-image">
          <img src="/heroimage.jpg" alt="Signup" />
        </div>
      </div>
    </>
  );
}
