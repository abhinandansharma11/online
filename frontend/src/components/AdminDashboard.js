import { useNavigate } from "react-router-dom"
import "./AdminDashboard.css"

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate()

  if (!user || user.type !== "admin") {
    return (
      <div className="admin-dashboard">
        <h2>Access Denied</h2>
        <p>Please login as admin to access this page</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>Welcome, {user.name || user.username}</p>
      </div>

      <div className="dashboard-menu">
        <div className="menu-card" onClick={() => navigate("/menu-manager")}> 
          <h3>Menu Manager</h3>
          <p>Add, edit, and manage menu items</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/order-management")}> 
          <h3>Order Management</h3>
          <p>View and manage customer orders</p>
        </div>
      </div>

      <button
        className="logout-btn"
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}
      >
        Logout
      </button>
    </div>
  )
}

export default AdminDashboard
