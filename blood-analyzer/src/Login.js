import "./Login.css";

function Login() {
  return (
    <>
    <nav className="navbar">
        <h1 className="logo">BeFit</h1>
          <div className="nav-links">
          <a href="#">About us</a>
          <a href="#">Help & Support</a>
        </div>

    </nav>
    <div className="login-container">
      <div className="login-left">
        <h2>Welcome back...</h2>
        <p className="subtitle">
          Enter your details to access your health data.
        </p>

        <input type="email" placeholder="Email" maxLength={32} />
        <input type="password" placeholder="Password" maxLength={32}/>

        <a href="#" className="forgot">Forgot password?</a>

        <button className="login-btn">Log in</button>

        <p className="signup-text">
          Don't have an account? <span>Sign up</span>
        </p>
      </div>

      <div className="login-right">
        <img src="/loginheroimage.jpg" alt="Health" />
      </div>
    </div>
    </>
  );
}

export default Login;
