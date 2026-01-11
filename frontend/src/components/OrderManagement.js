import { useState, useEffect } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import "./OrderManagement.css";

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') || 'http://localhost:5000';

const OrderManagement = ({ orders, setOrders }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentImage, setSelectedPaymentImage] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Search state for Confirmed and History tabs
  const [orderSearch, setOrderSearch] = useState("");
  // Confirmation overlay state
  const [showConfirmationOverlay, setShowConfirmationOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState("");
  // Controls whether the payment modal should show Confirm (pending) or only Close (confirmed/history)
  const [showConfirmInModal, setShowConfirmInModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_BASE + '/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Sort orders by creation date, newest first
          const sortedOrders = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAllOrders(sortedOrders);
        } else {
          setError(data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        setError('Failed to fetch orders');
      }
      setLoading(false);
    };
    fetchOrders();

    // Socket.io for real-time new orders
    const socket = io(API_BASE);
    socket.on('newOrder', (order) => {
      // Add new order at the beginning to show it at the top
      setAllOrders((prev) => [order, ...prev]);
    });
    return () => socket.disconnect();
  }, []);


  const updateOrderStatus = async (orderId, newStatus) => {
    console.log('updateOrderStatus called with:', orderId, newStatus); // Keep this debug log
    
    // Show confirmation overlay based on status being changed
    if (newStatus === 'confirmed') {
      setOverlayMessage("ORDER CONFIRMED");
      setShowConfirmationOverlay(true);
      setTimeout(() => {
        setShowConfirmationOverlay(false);
      }, 500);
    } else if (newStatus === 'ready') {
      setOverlayMessage("MARKED AS READY");
      setShowConfirmationOverlay(true);
      setTimeout(() => {
        setShowConfirmationOverlay(false);
      }, 500);
    } else if (newStatus === 'delivered') {
      setOverlayMessage("DELIVERED");
      setShowConfirmationOverlay(true);
      setTimeout(() => {
        setShowConfirmationOverlay(false);
      }, 500);
    } else if (newStatus === 'rejected') {
      setOverlayMessage("ORDER REJECTED");
      setShowConfirmationOverlay(true);
      setTimeout(() => {
        setShowConfirmationOverlay(false);
      }, 500);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + `/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAllOrders((prev) => prev.map((order) => (order.orderId === orderId ? { ...order, status: newStatus } : order)));
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (err) {
      alert('Failed to update order');
    }
  };

  const getOrdersByStatus = (status) => {
    const list = allOrders.filter((order) => order.status === status);
    const asc = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);   // oldest first
    const desc = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);  // newest first
    // For Pending and Confirmed: keep FIFO (earliest at top)
    if (status === 'pending' || status === 'confirmed') {
      return [...list].sort(asc);
    }
    // For other tabs, keep existing newest-first behavior
    return [...list].sort(desc);
  };

  // Real-time counts used for small UI badges
  const pendingCount = getOrdersByStatus("pending").length;
  const confirmedCount = getOrdersByStatus("confirmed").length;
  const rejectedCount = getOrdersByStatus("rejected").length;
  
  const handleShowPayment = (paymentScreenshot, orderId) => {
    setSelectedPaymentImage(paymentScreenshot)
    setSelectedOrderId(orderId)
    // Show Confirm only when opened from Pending tab; otherwise only Close
    setShowConfirmInModal(activeTab === "pending");
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedPaymentImage(null)
    setSelectedOrderId(null)
    setShowConfirmInModal(false)
  }

  const renderOrdersTable = (ordersList, showActions = true, enableSearch = false) => {
    // If search is enabled, filter orders by orderId
    let filteredOrders = ordersList;
    if (enableSearch && orderSearch.trim() !== "") {
      const search = orderSearch.trim().toLowerCase();
      filteredOrders = ordersList.filter(order => {
        const matchesOrderId = order.orderId && order.orderId.toString().toLowerCase().includes(search);
        const matchesItemName = Array.isArray(order.items) && order.items.some(it => {
          const name = it && it.item && it.item.name ? String(it.item.name).toLowerCase() : "";
          return name.includes(search);
        });
        return matchesOrderId || matchesItemName;
      });
    }
    return (
      <div className="table-container">
        {enableSearch && (
          <div className="order-search-bar">
            <input
              type="text"
              className="order-search-input"
              placeholder="Search by Order ID or Name..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
            />
          </div>
        )}
        <table className="orders-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Time</th>
              <th>Orders</th>
              <th>Order Total</th>
              <th>ORDER ID</th>
              <th>Payment Screenshot</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const orderId = order.orderId;
              // Calculate total
              const total = order.items.reduce((sum, item) => {
                const price = item.item && item.item.price ? item.item.price : 0;
                return sum + price * item.quantity;
              }, 0);
              return (
                <tr key={orderId}>
                  <td>
                    <span className="roll-number">{order.rollNo}</span>
                    {order.hostelTag && (
                      <span className={`first-year-hostel-badge ${order.hostelTag.includes('Girls') ? 'girls' : 'boys'}`}>{order.hostelTag}</span>
                    )}
                  </td>
                  <td>
                    {/* Format time in IST, hour:minute AM/PM */}
                    {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : '--'}
                  </td>
                  <td className="order-items-summary">
                    {order.items.map((item, index) => (
                      <span key={index} className="item-summary">
                        {item.quantity} {item.item && item.item.name ? item.item.name : ''} ₹{item.item && item.item.price ? item.item.price * item.quantity : 0}
                        {index < order.items.length - 1 && ', '}
                      </span>
                    ))}
                  </td>
                  <td className="order-total-cell">₹{total}</td>
                  <td className="order-id-cell">{orderId}</td>
                  <td className="payment-cell">
                    {order.paymentScreenshot ? (
                      <div className="payment-preview">
                        <img
                          src={order.paymentScreenshot || "/placeholder.svg"}
                          alt="Payment preview"
                          className="payment-thumbnail"
                        />
                        <button
                          className="show-payment-btn"
                          onClick={() => handleShowPayment(order.paymentScreenshot, orderId)}
                        >
                          Show Payment
                        </button>
                      </div>
                    ) : (
                      <span className="no-payment">No screenshot</span>
                    )}
                  </td>
                  {showActions && (
                    <td className="actions-cell">
                      {order.status === "pending" && (
                        <div className="action-buttons">
                          <button className="confirm-btn" onClick={() => updateOrderStatus(orderId, "confirmed")}> 
                            CONFIRM
                          </button>
                        </div>
                      )}
                      {order.status === "confirmed" && (
                        <button className="ready-btn" onClick={() => updateOrderStatus(orderId, "ready")}> 
                          MARK AS READY
                        </button>
                      )}
                      {order.status === "ready" && activeTab === "history" && (
                        <button className="delivered-btn" onClick={() => updateOrderStatus(orderId, "delivered")}> 
                          DELIVERED
                        </button>
                      )}
                      {order.status === "delivered" && activeTab === "history" && (
                        <div className="delivered-status">
                          <span className="delivered-checkmark">✓</span>
                          <span className="delivered-text">delivered</span>
                        </div>
                      )}
                      {order.status === "rejected" && (
                        <div className="rejected-status">
                          <span className="rejected-text">Rejected</span>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <p>No orders found</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="order-management">
      <div className="header">
        <button onClick={() => navigate("/admin")} className="back-btn">
          ← Back to Admin
        </button>
        <h2>Order Management</h2>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}> 
          Home
        </button>
        <button className={`tab ${activeTab === "pending" ? "active" : ""}`} onClick={() => setActiveTab("pending")}> 
          Pending Orders
          {pendingCount > 0 && (
            <span className="status-badge status-badge--pending">{pendingCount}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === "confirmed" ? "active" : ""}`}
          onClick={() => setActiveTab("confirmed")}
        >
          Confirmed Orders
          {confirmedCount > 0 && (
            <span className="status-badge status-badge--confirmed">{confirmedCount}</span>
          )}
        </button>
        <button className={`tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}> 
          History
        </button>
        {/* Rejected Orders tab moved to the extreme right */}
        <button className={`tab ${activeTab === "rejected" ? "active" : ""}`} onClick={() => setActiveTab("rejected")} style={{ marginLeft: 'auto' }}> 
          <span style={{ color: '#ff1f1f', fontWeight: 900 }}>
            Rejected Orders
          </span>
          {rejectedCount > 0 && (
            <span className="status-badge status-badge--rejected">{rejectedCount}</span>
          )}
        </button>
      </div>

      <div className="tab-content">
         {activeTab === "home" && (
          <div className="home-tab">
            <h3>Welcome to Order Management</h3>
            <p>Use the tabs above to navigate between different order statuses.</p>
            <div className="stats">
              <div className="stat-card">
                <h4>Pending Orders</h4>
                <span className="stat-number">{getOrdersByStatus("pending").length}</span>
              </div>
              <div className="stat-card">
                <h4>Confirmed Orders</h4>
                <span className="stat-number">{getOrdersByStatus("confirmed").length}</span>
              </div>
              <div className="stat-card">
                <h4>Completed Orders</h4>
                <span className="stat-number">{getOrdersByStatus("ready").length}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pending" && (
          <div className="orders-section">
            <h3>Pending Orders {pendingCount > 0 && <span className="status-badge status-badge--pending">{pendingCount}</span>}</h3>
            {renderOrdersTable(getOrdersByStatus("pending"), false, false)}
          </div>
        )}

        {activeTab === "confirmed" && (
          <div className="orders-section">
            <h3>Confirmed Orders {confirmedCount > 0 && <span className="status-badge status-badge--confirmed">{confirmedCount}</span>}</h3>
            {renderOrdersTable(getOrdersByStatus("confirmed"), true, true)}
          </div>
        )}

        {activeTab === "history" && (
          <div className="orders-section">
            <h3>Order History</h3>
            {(() => {
              const historyOrders = getOrdersByStatus("ready").concat(getOrdersByStatus("delivered"));
              // Apply same filtering logic as renderOrdersTable when search is enabled
              let filteredHistory = historyOrders;
              if (orderSearch.trim() !== "") {
                const search = orderSearch.trim().toLowerCase();
                filteredHistory = historyOrders.filter(order => {
                  const matchesOrderId = order.orderId && order.orderId.toString().toLowerCase().includes(search);
                  const matchesItemName = Array.isArray(order.items) && order.items.some(it => {
                    const name = it && it.item && it.item.name ? String(it.item.name).toLowerCase() : "";
                    return name.includes(search);
                  });
                  return matchesOrderId || matchesItemName;
                });
              }
              const totalOrders = filteredHistory.length;
              const totalAmount = filteredHistory.reduce((sum, order) => {
                const orderTotal = (Array.isArray(order.items) ? order.items : []).reduce((s, item) => {
                  const price = item && item.item && item.item.price ? item.item.price : 0;
                  const qty = item && item.quantity ? item.quantity : 0;
                  return s + price * qty;
                }, 0);
                return sum + orderTotal;
              }, 0);

              return (
                <>
                  {renderOrdersTable(historyOrders, true, true)}
                  <div className="history-metrics-bar">
                    <span>Total Orders: {totalOrders}</span>
                    <span>Total Amount: ₹{totalAmount}</span>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="orders-section">
            <h3 style={{ color: '#ff1f1f', fontWeight: 900 }}>Rejected Orders {rejectedCount > 0 && <span className="status-badge status-badge--rejected">{rejectedCount}</span>}</h3>
            {renderOrdersTable(getOrdersByStatus("rejected"), false, false)}
          </div>
        )}
      </div>

      {/* Order Confirmation Overlay */}
      {showConfirmationOverlay && (
        <div className="order-confirmation-overlay">
          <div className="order-confirmation-content">
            <h2>{overlayMessage}</h2>
          </div>
        </div>
      )}

      {/* Payment Screenshot Modal */}
      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={closePaymentModal}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h3 style={{ margin: 0 }}>Payment Screenshot - Order #{selectedOrderId}</h3>
                {showConfirmInModal && (
                  <button
                    className="reject-btn"
                    style={{ background: '#ff1f1f', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: '16px', boxShadow: '0 2px 8px rgba(255,31,31,0.18)' }}
                    onClick={() => {
                      updateOrderStatus(selectedOrderId, "rejected");
                      closePaymentModal();
                    }}
                  >
                    REJECT
                  </button>
                )}
              </div>
              <button className="close-btn" onClick={closePaymentModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <img
                src={selectedPaymentImage || "/placeholder.svg"}
                alt="Payment Screenshot"
                className="payment-full-image"
              />
            </div>
            <div className="modal-footer">
              {showConfirmInModal ? (
                <button
                  className="confirm-btn payment-confirm-btn"
                  onClick={() => {
                    updateOrderStatus(selectedOrderId, "confirmed");
                    closePaymentModal();
                  }}
                >
                  CONFIRM
                </button>
              ) : (
                <button className="close-btn" onClick={closePaymentModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderManagement
