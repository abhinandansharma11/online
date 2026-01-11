import { useState, useEffect } from "react";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import "./MenuManager.css";

// Add API base
const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') || 'http://localhost:5000';

const MenuManager = () => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "VEG",
  });

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Search state for menu items
  const [itemSearch, setItemSearch] = useState("");

  // Fetch menu from backend
  const fetchMenu = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.data);
      } else {
        setError(data.message || 'Failed to fetch menu');
      }
    } catch (err) {
      setError('Failed to fetch menu');
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu();
    socket.on('menuUpdated', fetchMenu);
    // Listen for real-time item availability/removal
    const handleAvailability = ({ itemId, available }) => {
      setMenuItems((prev) => prev.map(item => (item._id === itemId ? { ...item, available } : item)));
    };
    const handleRemove = ({ itemId }) => {
      setMenuItems((prev) => prev.filter(item => item._id !== itemId));
    };
    socket.on('itemAvailabilityChanged', handleAvailability);
    socket.on('itemRemoved', handleRemove);
    return () => {
      socket.off('menuUpdated', fetchMenu);
      socket.off('itemAvailabilityChanged', handleAvailability);
      socket.off('itemRemoved', handleRemove);
    };
  }, []);
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert("Please fill in all fields")
      return
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + '/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newItem.name,
          price: Number.parseInt(newItem.price),
          category: newItem.category
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to add item');
        return;
      }
      setNewItem({ name: "", price: "", category: "VEG" })
      setShowAddForm(false)
      // fetchMenu will be triggered by socket event
    } catch (err) {
      alert('Failed to add item');
    }
  }


  // Toggle item availability
  const handleToggleAvailability = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + `/api/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Failed to update availability');
      // UI will update via socket event
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  // Remove item
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_BASE + `/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Failed to remove item');
      // UI will update via socket event
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  return (
    <div className="menu-manager">
      <div className="header">
        <button onClick={() => navigate("/admin")} className="back-btn">
          ← Back to Admin
        </button>
        <h2>MENU MANAGER</h2>
      </div>

      <div className="add-section">
        <h3>Add or Remove Items</h3>
        <div className="bulk-actions-row">
          <button className="add-item-btn" onClick={() => setShowAddForm(!showAddForm)}>
            ADD ITEM
          </button>
          <button
            className="bulk-btn not-available"
            onClick={async () => {
              if (!window.confirm('Mark ALL items Not Available?')) return;
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(API_BASE + '/api/items/mark-all-not-available', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!data.success) return alert(data.message || 'Failed to update');
              } catch (e) {
                alert('Failed to update');
              }
            }}
          >
            MARK ALL NOT AVAILABLE
          </button>
          <button
            className="bulk-btn available"
            onClick={async () => {
              if (!window.confirm('Mark ALL items Available?')) return;
              try {
                const token = localStorage.getItem('token');
                const res = await fetch(API_BASE + '/api/items/mark-all-available', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!data.success) return alert(data.message || 'Failed to update');
              } catch (e) {
                alert('Failed to update');
              }
            }}
          >
            MARK ALL AVAILABLE
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-form">
          <h4>Add New Item</h4>
          <div className="form-group">
            <label>Item Name:</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="Enter item name"
            />
          </div>
          <div className="form-group">
            <label>Price:</label>
            <input
              type="number"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              placeholder="Enter price"
            />
          </div>
          <div className="form-group">
            <label>Category:</label>
            <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
              <option value="VEG">VEG</option>
              <option value="NON-VEG">NON-VEG</option>
            </select>
          </div>
          <div className="form-actions">
            <button onClick={handleAddItem} className="save-btn">
              ADD
            </button>
            <button onClick={() => setShowAddForm(false)} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="menu-list">
        <h3>Current Menu Items</h3>
        <div className="item-search-bar">
          <input
            type="text"
            className="item-search-input"
            placeholder="Search items by name..."
            value={itemSearch}
            onChange={e => setItemSearch(e.target.value)}
          />
        </div>
        <div className="items-grid">
          {loading && <div>Loading menu...</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {!loading && !error && menuItems
            .filter(item => item.name.toLowerCase().includes(itemSearch.trim().toLowerCase()))
            .map((item) => (
              <div key={item._id || item.id} className="menu-item-card">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price}</p>
                  <span className={`category ${item.category.toLowerCase()}`}>{item.category}</span>
                  {item.available === false && <span className="not-available-label">Not Available</span>}
                </div>
                <div className="item-actions">
                  <button className="toggle-availability-btn" onClick={() => handleToggleAvailability(item._id)}>
                    {item.available === false ? 'Mark Available' : 'Mark Not Available'}
                  </button>
                  <button className="delete-btn" onClick={() => handleRemoveItem(item._id)}>
                    Remove Item
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default MenuManager
