import "./Login.css";

function Login() {
  return (
    <div className="login-container">
      <div className="login-left">
        <h1 className="logo">BeFit</h1>

        <h2>Welcome back</h2>
        <p className="subtitle">
          Enter your details to access your health data.
        </p>

        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />

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
  );
}

export default Login;
