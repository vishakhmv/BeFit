import { useState } from "react";
import "./ForgotPassword.css";

export default function ForgotPassword({ onClose }) {
  const [step, setStep] = useState(1); // 1: Email & Password, 2: OTP Verification
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
        return;
      }

      setSuccess(data.message || "If this email is registered with us, you'll receive an OTP shortly. Please check your inbox and spam folder.");
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Update Password
  const handleVerifyAndUpdate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter OTP");
      setLoading(false);
      return;
    }

    try {
      // First verify OTP
      const verifyRes = await fetch("http://localhost:5000/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.message || "Invalid OTP");
        return;
      }

      // Then reset password
      const resetRes = await fetch("http://localhost:5000/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resetData = await resetRes.json();

      if (!resetRes.ok) {
        setError(resetData.message || "Failed to reset password");
        return;
      }

      setSuccess("Password updated successfully! You can now login.");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Error updating password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-overlay" onClick={onClose}>
      <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <h2>Reset Your Password</h2>

        {/* Step 1: Email & Password Input */}
        {step === 1 && (
          <div className="form-group">
            <p>Enter your details to reset your password</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button onClick={handleSendOtp} disabled={loading} className="btn-primary">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="form-group">
            <p>Enter the OTP sent to <strong>{email}</strong></p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              disabled={loading}
              maxLength="6"
            />
            <button onClick={handleVerifyAndUpdate} disabled={loading} className="btn-primary">
              {loading ? "Updating..." : "Verify & Update Password"}
            </button>
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>
    </div>
  );
}
