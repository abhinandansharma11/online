import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./LoginPage.css"

const SignUpPage = ({ setUser }) => {
  const navigate = useNavigate()
  const [userType, setUserType] = useState("student")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminPassword, setAdminPassword] = useState("")

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (userType === "student" && (!username || !password)) {
      alert("Please fill in all fields")
      return
    }
    if (userType === "admin" && (!adminName || !adminPassword)) {
      alert("Please fill in all fields")
      return
    }
    // Implement your signup logic here
    alert("Sign up successful! (Implement backend logic)")
    navigate("/login")
  }

  return (
    <div className="login-page sunburst-bg">
      {/* Sunburst decorations */}
      <div className="sunburst sunburst-tl" />
      <div className="sunburst sunburst-tr" />
      <div className="sunburst sunburst-bl" />
      <div className="sunburst sunburst-bc" />
      <div className="login-container">
        <div className="login-form-section">
          <div className="institution-logo">
            <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" alt="Institution Logo" className="logo-image" />
          </div>
          <h1 className="login-title">Sign Up</h1>
          <div className="user-type-selection-pill">
            <button
              type="button"
              className={`pill-btn${userType === "student" ? " active" : ""}`}
              onClick={() => setUserType("student")}
            >
              Student Sign Up
            </button>
            <button
              type="button"
              className={`pill-btn${userType === "admin" ? " active" : ""}`}
              onClick={() => setUserType("admin")}
            >
              Admin Sign Up
            </button>
          </div>
          <form onSubmit={handleSignUp} className="login-form">
            {userType === "student" ? (
              <>
                <div className="form-group">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    placeholder="Username"
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
            <button type="submit" className="login-btn">
              SIGN UP
            </button>
          </form>
          {/* Login link at the bottom left */}
          <div className="register-link-bottom">
            <span>Already Have An Account?</span>
            <span className="register-highlight" onClick={() => navigate("/login")}> LOGIN</span>
          </div>
        </div>
        <div className="hero-banner-section">
          <div className="hero-banner-card">
            <div className="hero-illustration">
              {/* Replace the src below with the new illustration image URL for the yellow card */}
              <img src="[PASTE_YOUR_IMAGE_2_URL_HERE]" alt="Food Illustration" />
            </div>
            <div className="banner-content">
              <div className="banner-title">
                Order Ready Hai Ya Nhi, Ab Sab Dikhega <span className="live-text">LIVE!!</span>
              </div>
              <div className="banner-desc">Ab Room pe Baithe Order Karo!!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
