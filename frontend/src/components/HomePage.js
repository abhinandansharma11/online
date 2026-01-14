import { useState, useEffect } from "react"
import socket from "../socket"
import { useNavigate } from "react-router-dom"
import "./HomePage.css"
import MeetCreators from "./MeetCreators"

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Ensure API_BASE is an absolute URL
if (!API_BASE.startsWith("http://") && !API_BASE.startsWith("https://")) {
  API_BASE = "https://" + API_BASE;
}

const HomePage = ({ cart, addToCart, removeFromCart, updateQuantity }) => {
  const navigate = useNavigate()
  const [showCheckout, setShowCheckout] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(API_BASE + "/api/items", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setMenuItems(data.data)
        } else {
          setError(data.message || "Failed to fetch menu")
        }
      } catch (err) {
        setError("Failed to fetch menu")
      }
      setLoading(false)
    }
    fetchMenu()
    // Listen for menu updates in real time
    socket.on("menuUpdated", fetchMenu)
    // Listen for item availability/removal
    const handleAvailability = ({ itemId, available }) => {
      setMenuItems((prev) => prev.map(item => (item._id === itemId ? { ...item, available } : item)));
    };
    const handleRemove = ({ itemId }) => {
      setMenuItems((prev) => prev.filter(item => item._id !== itemId));
    };
    socket.on('itemAvailabilityChanged', handleAvailability);
    socket.on('itemRemoved', handleRemove);
    return () => {
      socket.off("menuUpdated", fetchMenu)
      socket.off('itemAvailabilityChanged', handleAvailability);
      socket.off('itemRemoved', handleRemove);
    }
  }, [])

  const handleAddToCart = (item) => {
    addToCart(item)
    setShowCheckout(true)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getItemQuantity = (itemId) => {
    const cartItem = cart.find((item) => (item._id || item.id) === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  return (
    <div className="home-page">
      <header className="main-header">
        <div className="main-header-content">
          <h1 className="main-logo"><span className="logo-yellow">NiteBite</span> <span className="logo-at">@</span> <span className="logo-blue">RGIPT</span></h1>
          <div className="main-header-buttons">
            <div className="cart-icon" onClick={() => navigate("/checkout")}> 
              <span className="cart-text">Cart</span>
              <span className="cart-emoji" role="img" aria-label="cart">🛒</span>
              {getTotalItems() > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </div>
            <button className="order-history-btn" onClick={() => navigate("/order-history")}>History</button>
            <button className="order-history-btn" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login") }}>Logout</button>
          </div>
        </div>
      </header>

      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-main-heading">
              Ab naa Aawaz deni h, Naa Parchi<br />
              <span className="hero-highlight-yellow">Pandey Ji</span> Sab<br />
              <span className="hero-highlight-yellow">Digital</span> Chalate Hai!
            </h1>
            <p className="hero-subtext">
              With <span className="hero-highlight-yellow">NiteBite</span>, Order Food From The Comfort Of your <span className="hero-highlight-yellow">Hostel Rooms!!</span>
            </p>
          </div>
          <div className="hero-right">
            <div className="food-img food-img-1">
              {/* Food image placeholder - replace with your URL */}
              <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754418727/Pngtree_symmetrical_food_presentation_of_glossy_21071023_1_ctqr9b.png" alt="Food 1" />
            </div>
            <div className="food-img food-img-2">
              {/* Food image placeholder - replace with your URL */}
              <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754418813/Pngtree_fried_noodles_fast_food_19642629_1_mkxfys.png" alt="Food 2" />
            </div>
            <div className="food-img food-img-3">
              {/* Food image placeholder - replace with your URL */}
              <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754418851/vecteezy_chicken-curry-in-white-bowl-food-photography_47270229_1_c7tm81.png" alt="Food 3" />
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Rush notice banner */}
        
        {/* Order Now banner outside the card */}
        <div className="order-now-hero">
          {/* Spacer to keep heading perfectly centered with image on the right */}
          <span className="order-now-spacer" aria-hidden="true"></span>
          <h1 className="order-now-heading">Order Now!!</h1>
          <img
            className="order-now-image"
            src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1755116318/005b6728046ada244052dad09de2d3e0885f69f4_g5frtg.jpg"
            alt="Order Now placeholder"
          />
        </div>

        <div className="order-section">
          {/* Removed heading from inside the card as requested */}
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="menu">
            <div className="menu-category veg-category">
              <h2 className="menu-category-title veg-title">VEG</h2>
              <div className="menu-table">
                <div className="menu-table-header">
                  <span className="menu-col item-name">Item Name</span>
                  <span className="menu-col item-price">Price</span>
                  <span className="menu-col item-qty">Qty:</span>
                </div>
                {menuItems.filter(item => item.category === "VEG" && item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => {
                  const itemKey = item._id || item.id;
                  const quantity = getItemQuantity(itemKey);
                  const unavailable = item.available === false;
                  return (
                    <div className={`menu-table-row${unavailable ? ' unavailable' : ''}`} key={itemKey}>
                      <span className="menu-col item-name">{idx + 1}) {item.name} {unavailable && <span className="not-available-label">Not Available</span>}</span>
                      <span className="menu-col item-price">Rs {item.price}</span>
                      <span className="menu-col item-qty">
                        <button className="qty-btn" onClick={() => !unavailable && updateQuantity(itemKey, Math.max(quantity - 1, 0))} disabled={unavailable}>-</button>
                        <span className="qty-value">{quantity}</span>
                        <button className="qty-btn" onClick={() => !unavailable && addToCart(item)} disabled={unavailable}>+</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="menu-category nonveg-category">
              <h2 className="menu-category-title nonveg-title">NON-VEG</h2>
              <div className="menu-table">
                <div className="menu-table-header">
                  <span className="menu-col item-name">Item Name</span>
                  <span className="menu-col item-price">Price</span>
                  <span className="menu-col item-qty">Qty:</span>
                </div>
                {menuItems.filter(item => item.category === "NON-VEG" && item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => {
                  const itemKey = item._id || item.id;
                  const quantity = getItemQuantity(itemKey);
                  const unavailable = item.available === false;
                  return (
                    <div className={`menu-table-row${unavailable ? ' unavailable' : ''}`} key={itemKey}>
                      <span className="menu-col item-name">{idx + 1}) {item.name} {unavailable && <span className="not-available-label">Not Available</span>}</span>
                      <span className="menu-col item-price">Rs {item.price}</span>
                      <span className="menu-col item-qty">
                        <button className="qty-btn" onClick={() => !unavailable && updateQuantity(itemKey, Math.max(quantity - 1, 0))} disabled={unavailable}>-</button>
                        <span className="qty-value">{quantity}</span>
                        <button className="qty-btn" onClick={() => !unavailable && addToCart(item)} disabled={unavailable}>+</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <button className="checkout-btn" onClick={() => navigate("/checkout")}>
            CHECKOUT
          </button>
        </div>
      </div>

      {/* Meet The Creators section */}
      <MeetCreators />
    </div>
  )
}

export default HomePage
