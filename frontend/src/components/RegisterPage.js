import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const API_BASE = process.env.REACT_APP_API_BASE;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Require institute email domain
    const trimmedEmail = email.trim().toLowerCase();
    const rgiptRegex = /^[^\s@]+@rgipt\.ac\.in$/i;
    if (!rgiptRegex.test(trimmedEmail)) {
      alert('Please use your institute email id');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: username.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Registration failed");
        setLoading(false);
        return;
      }
      // Save pending email for verification flow
      localStorage.setItem('pendingVerificationEmail', trimmedEmail);
      
      navigate("/verify-email");
    } catch (err) {
      alert("Registration error");
    }
    setLoading(false);
  };

  return (
    <div className="login-page sunburst-bg">
      {/* Sunburst decorations (reuse same assets as login) */}
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" alt="Decoration" className="sunburst" />
      </div>
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" alt="Decoration" className="sunburst-tr" />
      </div>

      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Register</h1>
          <form onSubmit={handleRegister} className="login-form">
            {/* Email */}
            <div className="form-group">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="College Email ID Only"
              />
            </div>
            {/* Username */}
            <div className="form-group">
              <span className="input-icon">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                placeholder="Name"
              />
            </div>
            {/* New Password */}
            <div className="form-group password-group">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="New Password"
                autoComplete="new-password"
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword((v) => !v)}
                style={{ cursor: 'pointer', marginLeft: 8 }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "👁️" : "👁"}
              </span>
            </div>
            {/* Confirm Password */}
            <div className="form-group password-group">
              <span className="input-icon">🔒</span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ cursor: 'pointer', marginLeft: 8 }}
                title={showConfirmPassword ? "Hide Password" : "Show Password"}
              >
                {showConfirmPassword ? "👁️" : "👁"}
              </span>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "REGISTERING..." : "REGISTER"}
            </button>
          </form>
          {/* Login link styled like bottom register link in login page */}
          <div className="register-link-bottom">
            <span>Already Have An Account?</span>
            <span className="register-highlight" onClick={() => navigate("/login")}> LOGIN</span>
          </div>
        </div>
        <div className="hero-banner-section">
          <div className="banner-content">
            <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754415310/WhatsApp_Image_2025-08-05_at_10.34.36_PM_t2xrzr.jpg" alt="Food Illustration" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
