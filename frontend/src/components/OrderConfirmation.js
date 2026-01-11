import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import socket from "../socket"
import "./OrderConfirmation.css"

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') || 'http://localhost:5000';

const OrderConfirmation = ({ orders }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(() => {
    // Try to get order from props first, then from localStorage
    const localOrder = orders?.find((o) => o.orderId === orderId);
    if (localOrder) return localOrder;
    // Check localStorage for order data
    const storedOrder = localStorage.getItem(`order_${orderId}`);
    return storedOrder ? JSON.parse(storedOrder) : null;
  });
  const [orderStatus, setOrderStatus] = useState(order?.status || "waiting");
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // Helper function to save order to localStorage
  const saveOrderToStorage = (orderData) => {
    if (orderData) {
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
    }
  };

  // Helper to render order summary used across statuses (prepared, delivered)
  const renderOrderSummary = () => {
    if (!order) return null;
    return (
      <div className="order-summary-box">
        <h4>ORDER SUMMARY</h4>
        <div className="summary-content">
          {order.items.map((item) => (
            <div key={item.id} className="summary-item">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Order Total: ₹{order.total}</strong>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Always fetch latest order from backend on mount
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + `/api/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const found = data.data.find((o) => o.orderId === orderId);
          if (found) {
            // Transform the order data to match frontend expectations
            const transformedOrder = {
              ...found,
              items: found.items.map(item => ({
                id: item.item._id || item.item.id,
                name: item.item.name,
                price: item.item.price,
                quantity: item.quantity
              })),
              total: found.items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
            };
            setOrder(transformedOrder);
            setOrderStatus(found.status || "waiting");
            saveOrderToStorage(transformedOrder);
          } else {
            setError('Order not found');
          }
        } else {
          setError(data.message || 'Order not found');
        }
      } catch (err) {
        setError('Order not found');
      }
      setLoading(false);
    };

    fetchOrder(); // Always fetch from backend
    // Identify student to socket.io for targeted updates
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      socket.emit('identify', user.id);
    }
    // Listen for real-time order status updates
    const handleStatusUpdate = (payload) => {
      if (payload.orderId === orderId) {
        setOrderStatus(payload.status);
        // Update order status in localStorage
        if (order) {
          const updatedOrder = { ...order, status: payload.status };
          saveOrderToStorage(updatedOrder);
        }
      }
    };
    socket.on('orderStatusUpdated', handleStatusUpdate);
    // Listen for real-time rejection
    const handleOrderRejected = (payload) => {
      if (payload.orderId === orderId) {
        setOrderStatus('rejected');
        setRejectionMessage(payload.message);
        if (order) {
          const updatedOrder = { ...order, status: 'rejected' };
          saveOrderToStorage(updatedOrder);
        }
      }
    };
    socket.on('orderRejected', handleOrderRejected);
    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
      socket.off('orderRejected', handleOrderRejected);
    };
  }, [orderId]);

  // Remove simulated progression, now handled by real-time updates

  if (loading) {
    return <div className="order-confirmation"><h2>Loading order...</h2></div>;
  }
  if (error || !order) {
    return (
      <div className="order-confirmation">
        <h2>Order not found</h2>
        <button onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const renderOrderStatus = () => {
    console.log('Current order status:', orderStatus);  // Add logging for debugging
    console.log('Current order:', order);  // Add logging for debugging
    
    switch (orderStatus) {
      case "waiting":
      case "pending":
        return (
          <div className="status-screen">
            <div className="waiting-box">
              <div className="waiting-message">WAITING FOR ORDER CONFIRMATION</div>
              <div className="order-id">ORDER ID: {order.orderId || orderId}</div>
              <div className="waiting-icon">⏳</div>
            </div>
          </div>
        )

      case "confirmed":
        return (
          <div className="status-screen confirmed">
            <h2>ORDER CONFIRMED</h2>
            <p>Order ID: {order.orderId}</p>
            <div className="order-summary-box">
              <h4>ORDER SUMMARY</h4>
              <div className="summary-content">
                {order.items.map((item) => (
                  <div key={item.id} className="summary-item">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="summary-total">
                  <strong>Order Total: ₹{order.total}</strong>
                </div>
              </div>
            </div>
            <p className="confirmation-note">Pandey Ji has verified your payment</p>
            
            <p>Your order is being prepared...</p>
          </div>
        )

      case "prepared":
      case "ready":
        return (
          <div className="status-screen prepared">
            <h2>ORDER PREPARED!!</h2>
            <div className="pickup-section">
              <h3>PICK YOUR ORDER IN 10 MINUTES</h3>
              <p>Panday Ji's waiting!!!</p>
              <p style={{ fontWeight: 900, fontSize: '1.5em', margin: '10px 0' }}>Order ID: {order.orderId}</p>
              <p>Roll No: {order.rollNo}</p>
            </div>
            {renderOrderSummary()}
            <button className="home-btn" onClick={() => navigate("/")}> 
              Back to Home
            </button>
          </div>
        )

      case "delivered":
        return (
          <div className="status-screen delivered">
            <div className="delivered-confirmation">
              <div className="delivered-checkmark-large">✓</div>
              <h2>DELIVERED</h2>
              <p>Order ID: {order.orderId}</p>
              <p>Your order has been successfully delivered!</p>
            </div>
            {renderOrderSummary()}
            <button className="home-btn" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        )

      case "rejected":
        return (
          <div className="status-screen rejected">
            <h2 style={{ color: '#ff1f1f' }}>ORDER REJECTED</h2>
            <p>Order ID: {order.orderId}</p>
            <div className="rejection-note" style={{ color: '#b00020', fontWeight: 700, background: '#ffe5e5', borderRadius: 10, padding: '16px', margin: '18px 0', boxShadow: '0 2px 10px rgba(176,0,32,0.12)' }}>
              {rejectionMessage || "Your order has been rejected due to submission of a fake or unclear payment screenshot. If this was not intentional or was submitted by mistake, please visit the night canteen and present the actual payment proof. Kindly ensure this is not repeated in the future."}
            </div>
            <button className="home-btn" onClick={() => navigate("/")}>Back to Home</button>
          </div>
        );
      default:
        return null
    }
  }

  console.log('Rendering component with status:', orderStatus);
  return (
    <div className="order-confirmation">
      {/* Sunburst Images - REMOVE the left sunburst for rejected orders */}
      {orderStatus !== 'rejected' && (
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754413503/Vector_h5xttx.png" alt="Sunburst" className="sunburst-bottom1left" />
      )}
     
      
      <div className="order-status-container">
        {renderOrderStatus()}
      </div>
    </div>
  )
}

export default OrderConfirmation
