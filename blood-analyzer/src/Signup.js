import { useNavigate } from "react-router-dom";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = () => {
    //add the signup logic here
    navigate("/home");
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

          <input type="text" placeholder="Full Name" />
          <input type="email" placeholder="Email" />
          <input type="dob" placeholder="D.O.B" />
          <input type="password" placeholder="Password" />
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
