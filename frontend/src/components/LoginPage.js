import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./LoginPage.css"

const API_BASE = process.env.REACT_APP_API_BASE;

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate()
  const [userType, setUserType] = useState("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (userType === "student" && (!email || !password)) {
      alert("Please fill in all fields")
      return
    }
    if (userType === "admin" && (!adminName || !adminPassword)) {
      alert("Please fill in all fields")
      return
    }
    try {
      setLoading(true)
      const url = userType === "admin" ? "/api/auth/admin/login" : "/api/auth/student/login"
      const body = userType === "admin" ? { username: adminName.toLowerCase(), password: adminPassword } : { email: email.trim().toLowerCase(), password }
      const res = await fetch(API_BASE + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) {
        if (res.status === 403 && data.message && data.message.toLowerCase().includes('verify')) {
          localStorage.setItem('pendingVerificationEmail', email.trim().toLowerCase());
          alert('Email not verified. Please enter the token sent to your email.');
          navigate('/verify-email');
          setLoading(false)
          return;
        }
        alert(data.message || "Login failed")
        setLoading(false)
        return
      }
      localStorage.setItem("token", data.token)
      // Include student email in stored user so roll number can be derived later
      const payloadUser = userType === 'student' ? { ...data.data, email: email.trim().toLowerCase() } : data.data;
      localStorage.setItem("user", JSON.stringify(payloadUser))
      setUser(payloadUser)
      navigate(userType === "admin" ? "/admin" : "/")
    } catch (err) {
      alert("Login error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page sunburst-bg">
      {/* Sunburst decorations */}
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413839/Screenshot_2025-08-05_224001_xuu1go.png" alt="Institution Logo" className="sunburst" />
      </div>
      <div>
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" alt="Institution Logo" className=" sunburst-tr" />
      </div>
      
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Login</h1>
          <div className="user-type-selection-pill">
            <button
              type="button"
              className={`pill-btn${userType === "student" ? " active" : ""}`}
              onClick={() => setUserType("student")}
            >
              Student Login
            </button>
            <button
              type="button"
              className={`pill-btn${userType === "admin" ? " active" : ""}`}
              onClick={() => setUserType("admin")}
            >
              Admin Login
            </button>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            {userType === "student" ? (
              <>
                <div className="form-group">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="Registered Email"
                  />
                </div>
                <div className="form-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="form-input"
                    placeholder="Username"
                  />
                </div>
                <div className="form-group">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="form-input"
                    placeholder="Password"
                  />
                </div>
              </>
            )}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>
          {/* Forgot Password Link for Students Only (outside the form) */}
          {userType === "student" && (
            <div style={{ textAlign: "right", marginBottom: "10px" }}>
              <span 
                style={{ 
                  color: "#2c5aa0", 
                  cursor: "pointer", 
                  fontSize: "14px",
                  textDecoration: "underline"
                }}
                onClick={() => {
                  navigate("/forgot-password");
                }}
              >
                Forgot Password?
              </span>
            </div>
          )}
          {/* Register link at the bottom left */}
          <div className="register-link-bottom">
            <span>Don't Have An Account?</span>
            <span className="register-highlight" onClick={() => navigate("/register")}> REGISTER</span>
          </div>
        </div>
        <div className="hero-banner-section">
          
            
            <div className="banner-content">
              <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754415310/WhatsApp_Image_2025-08-05_at_10.34.36_PM_t2xrzr.jpg" alt="Food Illustration" />
               </div>
            </div>
          
        </div>
      </div>
    
  )
}

export default LoginPage
