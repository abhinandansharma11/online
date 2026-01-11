import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import CheckoutPage from "./components/CheckoutPage";
import OrderConfirmation from "./components/OrderConfirmation";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import AdminDashboard from "./components/AdminDashboard";
import MenuManager from "./components/MenuManager";
import OrderManagement from "./components/OrderManagement";
import OrderHistory from "./components/OrderHistory";
import VerifyEmail from "./components/VerifyEmail";
import "./App.css";
import Footer from "./components/Footer";

const API_BASE = process.env.REACT_APP_API_BASE;

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  if (!token || !user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role || user.type)) return <Navigate to="/login" />;
  return children;
}

function App() {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  useEffect(() => { user ? localStorage.setItem('user', JSON.stringify(user)) : localStorage.removeItem('user'); }, [user]);

  const [orders, setOrders] = useState([]);

  const addToCart = (item) => {
    const id = item._id || item.id;
    const existingItem = cart.find((cartItem) => (cartItem._id || cartItem.id) === id);
    if (existingItem) {
      setCart(cart.map((cartItem) => (cartItem._id || cartItem.id) === id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  const removeFromCart = (itemId) => { setCart(cart.filter((item) => (item._id || item.id) !== itemId)); };
  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) { removeFromCart(itemId); } else { setCart(cart.map((item) => ((item._id || item.id) === itemId ? { ...item, quantity } : item))); }
  };
  const clearCart = () => { setCart([]); };

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    const isPublic = publicPaths.includes(location.pathname);
    if (!token || !userData) {
      if (!isPublic) navigate('/login', { replace: true });
      return;
    }
    const validateToken = async () => {
      try {
        const res = await fetch(API_BASE + '/api/auth/validate', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!isPublic) navigate('/login', { replace: true });
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isPublic) navigate('/login', { replace: true });
      }
    };
    validateToken();
  }, [location, navigate]);

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={<PrivateRoute allowedRoles={['student']}><HomePage cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute allowedRoles={['student']}><CheckoutPage cart={cart} clearCart={clearCart} setOrders={setOrders} orders={orders} /></PrivateRoute>} />
        <Route path="/order-history" element={<PrivateRoute allowedRoles={['student']}><OrderHistory /></PrivateRoute>} />
        <Route path="/order-confirmation/:orderId" element={<PrivateRoute allowedRoles={['student']}><OrderConfirmation orders={orders} /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard user={user} /></PrivateRoute>} />
        <Route path="/menu-manager" element={<PrivateRoute allowedRoles={['admin']}><MenuManager /></PrivateRoute>} />
        <Route path="/order-management" element={<PrivateRoute allowedRoles={['admin']}><OrderManagement orders={orders} setOrders={setOrders} /></PrivateRoute>} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App
