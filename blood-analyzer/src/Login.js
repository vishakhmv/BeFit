import "./Login.css";

export default function Login() {
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
        <button>Log in</button>
      </div>
      <div className="login-img">
        <img src="/loginheroimage.jpg" alt="Login" />
      </div>
    </div>
    </>
  );
}