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
  const foods = ["Veg", "Non-Veg"];
  const [sex, setSex] = useState("");
  const indianStates = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // Email Verification States
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [emailVerificationStep, setEmailVerificationStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [emailVerificationOtp, setEmailVerificationOtp] = useState("");
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // WhatsApp Verification States
  const [showWhatsappVerificationModal, setShowWhatsappVerificationModal] = useState(false);
  const [whatsappVerificationStep, setWhatsappVerificationStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [whatsappVerificationOtp, setWhatsappVerificationOtp] = useState("");
  const [whatsappVerificationLoading, setWhatsappVerificationLoading] = useState(false);
  const [whatsappVerificationError, setWhatsappVerificationError] = useState("");
  const [whatsappVerificationSuccess, setWhatsappVerificationSuccess] = useState("");
  const [isWhatsappVerified, setIsWhatsappVerified] = useState(false);

  // Send OTP to Email
  const handleSendEmailOtp = async () => {
    setEmailVerificationLoading(true);
    setEmailVerificationError("");
    setEmailVerificationSuccess("");

    if (!email) {
      setEmailVerificationError("Please enter email first");
      setEmailVerificationLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailVerificationError(data.message || "Failed to send OTP");
        return;
      }

      setEmailVerificationSuccess("OTP sent to your email! Check your inbox and spam folder.");
      setEmailVerificationStep(2);
    } catch (err) {
      console.error(err);
      setEmailVerificationError("Error sending OTP. Please try again.");
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    setEmailVerificationLoading(true);
    setEmailVerificationError("");
    setEmailVerificationSuccess("");

    if (!emailVerificationOtp) {
      setEmailVerificationError("Please enter OTP");
      setEmailVerificationLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: emailVerificationOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailVerificationError(data.message || "Invalid OTP");
        return;
      }

      setEmailVerificationSuccess("Email verified successfully!");
      setIsEmailVerified(true);
      setTimeout(() => {
        setShowEmailVerificationModal(false);
        setEmailVerificationStep(1);
        setEmailVerificationOtp("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setEmailVerificationError("Error verifying OTP. Please try again.");
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  // Send OTP to WhatsApp
  const handleSendWhatsappOtp = async () => {
    setWhatsappVerificationLoading(true);
    setWhatsappVerificationError("");
    setWhatsappVerificationSuccess("");

    if (!whatsapp) {
      setWhatsappVerificationError("Please enter WhatsApp number first");
      setWhatsappVerificationLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(whatsapp)) {
      setWhatsappVerificationError("Please enter a valid 10-digit WhatsApp number");
      setWhatsappVerificationLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/send-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setWhatsappVerificationError(data.message || "Failed to send OTP");
        return;
      }

      setWhatsappVerificationSuccess("OTP sent to your WhatsApp! Check your messages.");
      setWhatsappVerificationStep(2);
    } catch (err) {
      console.error(err);
      setWhatsappVerificationError("Error sending OTP. Please try again.");
    } finally {
      setWhatsappVerificationLoading(false);
    }
  };

  // Verify WhatsApp OTP
  const handleVerifyWhatsappOtp = async () => {
    setWhatsappVerificationLoading(true);
    setWhatsappVerificationError("");
    setWhatsappVerificationSuccess("");

    if (!whatsappVerificationOtp) {
      setWhatsappVerificationError("Please enter OTP");
      setWhatsappVerificationLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/verify-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp: whatsappVerificationOtp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setWhatsappVerificationError(data.message || "Invalid OTP");
        return;
      }

      setWhatsappVerificationSuccess("WhatsApp verified successfully!");
      setIsWhatsappVerified(true);
      setTimeout(() => {
        setShowWhatsappVerificationModal(false);
        setWhatsappVerificationStep(1);
        setWhatsappVerificationOtp("");
      }, 2000);
    } catch (err) {
      console.error(err);
      setWhatsappVerificationError("Error verifying OTP. Please try again.");
    } finally {
      setWhatsappVerificationLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!isEmailVerified) {
      setError("Please verify your email first");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, dob, whatsapp, sex, food, state, password}),
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
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEmailVerified}
            />
            <button 
              type="button" 
              className={`verify-btn ${isEmailVerified ? "verified" : ""}`}
              onClick={() => setShowEmailVerificationModal(true)}
              disabled={isEmailVerified}
            >
              {isEmailVerified ? "✓ Verified" : "Verify"}
            </button>
          </div>
          <input 
            type="date" 
            placeholder="D.O.B" 
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <div className="input-group">
            <input 
              type="text" 
              placeholder="WhatsApp Number (10 digits)" 
              value={whatsapp} 
              onChange={(e) => setWhatsapp(e.target.value)} 
              maxLength="10" 
              disabled={isWhatsappVerified}
              required 
            />
            <button 
              type="button" 
              className={`verify-btn ${isWhatsappVerified ? "verified" : ""}`}
              onClick={() => setShowWhatsappVerificationModal(true)}
              disabled={isWhatsappVerified}
            >
              {isWhatsappVerified ? "✓ Verified" : "Verify"}
            </button>
          </div>
           <select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>


          <select value={food} onChange={(e) => setPreference(e.target.value)}>
            <option value="">Select Food Preference</option>
            {foods.map((item, index) => (
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

      {/* Email Verification Modal */}
      {showEmailVerificationModal && (
        <div className="email-verification-overlay" onClick={() => setShowEmailVerificationModal(false)}>
          <div className="email-verification-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowEmailVerificationModal(false)}>&times;</button>

            <h2>Verify Your Email</h2>

            {/* Step 1: Send OTP */}
            {emailVerificationStep === 1 && (
              <div className="form-group">
                <p>Enter your email to receive an OTP</p>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={emailVerificationLoading}
                />
                <button 
                  onClick={handleSendEmailOtp} 
                  disabled={emailVerificationLoading} 
                  className="btn-primary"
                >
                  {emailVerificationLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {/* Step 2: Verify OTP */}
            {emailVerificationStep === 2 && (
              <div className="form-group">
                <p>Enter the OTP sent to your email</p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={emailVerificationOtp}
                  onChange={(e) => setEmailVerificationOtp(e.target.value)}
                  disabled={emailVerificationLoading}
                  maxLength="6"
                />
                <button 
                  onClick={handleVerifyEmailOtp} 
                  disabled={emailVerificationLoading} 
                  className="btn-primary"
                >
                  {emailVerificationLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button 
                  onClick={() => setEmailVerificationStep(1)} 
                  className="btn-secondary"
                >
                  Back
                </button>
              </div>
            )}

            {emailVerificationError && (
              <p style={{color: "red", fontSize: "14px", marginTop: "10px"}}>
                {emailVerificationError}
              </p>
            )}
            {emailVerificationSuccess && (
              <p style={{color: "green", fontSize: "14px", marginTop: "10px"}}>
                {emailVerificationSuccess}
              </p>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Verification Modal */}
      {showWhatsappVerificationModal && (
        <div className="email-verification-overlay" onClick={() => setShowWhatsappVerificationModal(false)}>
          <div className="email-verification-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowWhatsappVerificationModal(false)}>&times;</button>

            <h2>Verify Your WhatsApp</h2>

            {/* Step 1: Send OTP */}
            {whatsappVerificationStep === 1 && (
              <div className="form-group">
                <p>Enter your WhatsApp number to receive an OTP</p>
                <input
                  type="text"
                  placeholder="WhatsApp number (10 digits)"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={whatsappVerificationLoading}
                  maxLength="10"
                />
                <button 
                  onClick={handleSendWhatsappOtp} 
                  disabled={whatsappVerificationLoading} 
                  className="btn-primary"
                >
                  {whatsappVerificationLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {/* Step 2: Verify OTP */}
            {whatsappVerificationStep === 2 && (
              <div className="form-group">
                <p>Enter the OTP sent to your WhatsApp</p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={whatsappVerificationOtp}
                  onChange={(e) => setWhatsappVerificationOtp(e.target.value)}
                  disabled={whatsappVerificationLoading}
                  maxLength="6"
                />
                <button 
                  onClick={handleVerifyWhatsappOtp} 
                  disabled={whatsappVerificationLoading} 
                  className="btn-primary"
                >
                  {whatsappVerificationLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button 
                  onClick={() => setWhatsappVerificationStep(1)} 
                  className="btn-secondary"
                >
                  Back
                </button>
              </div>
            )}

            {whatsappVerificationError && (
              <p style={{color: "red", fontSize: "14px", marginTop: "10px"}}>
                {whatsappVerificationError}
              </p>
            )}
            {whatsappVerificationSuccess && (
              <p style={{color: "green", fontSize: "14px", marginTop: "10px"}}>
                {whatsappVerificationSuccess}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
