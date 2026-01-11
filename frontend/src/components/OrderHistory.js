import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import "./OrderHistory.css";

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') || 'http://localhost:5000';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(API_BASE + "/api/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          // Sort orders by creation date, newest first
          const sortedOrders = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sortedOrders);
        } else {
          setError(data.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError("Failed to fetch orders");
      }
      setLoading(false);
    };
    fetchOrders();

    // Identify student to socket.io for targeted updates
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id) {
      socket.emit('identify', user.id);
    }

    // Listen for real-time order status updates
    const handleStatusUpdate = (payload) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === payload.orderId 
            ? { ...order, status: payload.status }
            : order
        )
      );
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
    };
  }, []);

  return (
    <div className="history-page-container">
      <div className="history-header-section">
        <button className="history-home-button" onClick={() => navigate("/")}>
          Home
        </button>
        <div className="history-title-section">
          <h1 className="history-title">History</h1>
          <div className="history-icon">⏰</div>
        </div>
      </div>

      <div className="history-content-section">
        {loading && <div className="history-loading">Loading...</div>}
        {error && <div className="history-error">{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="history-no-orders">No orders found.</div>
        )}
        {!loading && !error && orders.length > 0 && (
          <div className="history-orders-list">
            {orders.map((order) => (
              <div key={order._id} className="history-order-card">
                <div className="history-order-details">
                  <div className="history-order-field">
                    <span className="history-field-label">Order ID:</span>
                    <span className="history-field-value">{order.orderId}</span>
                  </div>
                  <div className="history-order-field">
                    <span className="history-field-label">Status:</span>
                    <span className={`history-field-value ${order.status === 'delivered' ? 'delivered-status-text' : ''} ${order.status === 'rejected' ? 'rejected-status-text' : ''}`}>
                      {order.status === 'delivered' ? 'delivered' : order.status === 'rejected' ? 'Rejected' : order.status}
                    </span>
                  </div>
                  <div className="history-order-field">
                    <span className="history-field-label">Placed:</span>
                    <span className="history-field-value">
                      {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div className="history-order-field">
                    <span className="history-field-label">Items:</span>
                    <div className="history-items-list">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="history-item">
                          {i.item.name} x {i.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  className="history-view-status-button"
                  onClick={() => navigate(`/order-confirmation/${order.orderId}`)}
                >
                  View Status
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-footer-section">
        <p className="history-footer-text">
          The History gets deleted in 12 hours automatically.
        </p>
      </div>
    </div>
  );
};

export default OrderHistory;
