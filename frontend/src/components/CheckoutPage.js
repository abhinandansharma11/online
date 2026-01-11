"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./CheckoutPage.css"

const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '') || 'http://localhost:5000';
// Cloudinary unsigned upload settings (set in frontend env for fastest flow)
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UNSIGNED_PRESET;
// UPI ID text (read-only). Update this string later when you have the final UPI ID
const DISPLAY_UPI = "Q025308387@ybl";

// Direct upload to Cloudinary (unsigned). Returns secure URL or null on failure
async function uploadScreenshotDirect(file) {
  try {
    if (!file || !CLOUD_NAME || !UPLOAD_PRESET) return null; // fallback if not configured
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);
    // Optional client-side downscale/compress via Cloudinary can be added if desired
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  } catch (e) {
    return null;
  }
}

const CheckoutPage = ({ cart, clearCart, setOrders, orders }) => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState("")
  const [rollNo, setRollNo] = useState("")
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [isFirstYearEligible, setIsFirstYearEligible] = useState(false);
  const [firstYearAnswer, setFirstYearAnswer] = useState(null); // kept for compatibility
  const [hostelChoice, setHostelChoice] = useState(''); // 'boys' | 'girls'

  // Pre-fill roll number from the first 8 characters of the logged-in student's email and disable editing
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const email = (user && user.email) ? String(user.email).trim().toLowerCase() : '';
      if (email && email.length >= 8) {
        setRollNo(email.substring(0, 8));
      }
      // First year eligibility detection
      if (email) {
        const emailYearPrefix = email.substring(0, 2); // first two digits
        const currentYearYY = String(new Date().getFullYear() % 100).padStart(2,'0');
        if (emailYearPrefix === currentYearYY) {
          setIsFirstYearEligible(true);
          setFirstYearAnswer('yes'); // auto-confirm first year
          setHostelChoice(prev => prev || 'boys'); // default to boys if not already chosen
        }
      }
    } catch (_) {
      // ignore parsing errors silently
    }
  }, []);

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleConfirmOrder = async () => {
    if (!rollNo) {
      alert("Please enter your roll number");
      return;
    }
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }
    if (!paymentScreenshot) {
      alert("Please upload a payment screenshot");
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const items = cart.map(item => ({ item: item._id || item.id, quantity: item.quantity }));

      // 1) Try direct Cloudinary upload to get a URL
      const proofUrl = await uploadScreenshotDirect(paymentScreenshot);

      let res;
      if (proofUrl) {
        // 2a) Fast path: send small JSON payload with URL
        res = await fetch(API_BASE + '/api/orders', {
          method: 'POST',
          headers:
           {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items, rollNo, paymentScreenshot: proofUrl, firstYear: isFirstYearEligible, hostelChoice }) ,
        });
      } else {
        // 2b) Fallback: keep existing FormData flow (server will handle file upload)
        const formData = new FormData();
        formData.append('items', JSON.stringify(items));
        formData.append('rollNo', rollNo);
        formData.append('paymentScreenshot', paymentScreenshot);
        formData.append('firstYear', isFirstYearEligible);
        formData.append('hostelChoice', hostelChoice);
        res = await fetch(API_BASE + '/api/orders', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
      }

      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Order failed');
        setIsLoading(false);
        return;
      }
      setOrders([...orders, data.data]);
      clearCart();
      setIsLoading(false);
      navigate(`/order-confirmation/${data.data.orderId}`);
    } catch (err) {
      alert('Order error');
      setIsLoading(false);
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPaymentScreenshot(file);
    }
  }

  const handleCopyUpi = async () => {
    const textToCopy = DISPLAY_UPI;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 1200);
    } catch {}
  }

  return (
    <div className="checkout-page-redesign">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="checkout-loader-overlay">
          <div className="checkout-loader-spinner"></div>
          <div className="checkout-loader-message">Do not refresh it may take upto 15-20 seconds</div>
        </div>
      )}

      {/* Sunburst Images - fill URLs below */}
      <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754435362/Vector_4_jwimjx.png" alt="Sunburst" className="sunburst-topright" />

      {/* Logo Top Left */}
      <div className="logo-absolute">
        <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1754410231/Rajiv_Gandhi_Institute_of_Petroleum_Technology_c3svuc.png" alt="Logo" className="logo-image-redesign" />
      </div>

      {/* Main Content - shifted below logo */}
      <div className="main-content" style={isLoading ? { filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' } : {}}>
        <div className="header-row">
          <button onClick={() => navigate("/")} className="header-btn header-left-btn">
            ← Home
          </button>
          <div className="order-summary-header">
            <h2>Order Summary</h2>
          </div>
          <button
            type="button"
            className="header-btn header-right-btn"
            onClick={() => clearCart()}
          >
            Clear Cart
          </button>
        </div>
        <div className="panels-wrapper">
          {/* Order Panel */}
          <div className="panel order-panel-redesign">
            <h3 className="panel-title">Your Order</h3>
            <div className="order-items-redesign">
              {cart.map((item) => (
                <div key={item.id} className="order-item-redesign">
                  <span className="item-details-redesign">
                    {item.quantity} x {item.name}
                  </span>
                  <span className="item-price-redesign">Rs {item.price * item.quantity}</span>
                </div>
              ))}
              <div className="order-divider-redesign"></div>
              <div className="order-total-redesign">
                <span>Order Total: Rs {getTotalPrice()}</span>
              </div>
            </div>
          </div>
          {/* Payment Panel */}
          <div className="panel payment-panel-redesign">
            <h3 className="panel-title">Make Payment</h3>
            <div className="qr-section-redesign">
              <img src="https://res.cloudinary.com/djdcwwpbl/image/upload/v1758389852/WhatsApp_Image_2025-09-20_at_11.05.47_PM_xgvdf8.jpg" alt="QR Code for Payment" className="qr-image-redesign" />
            </div>
            {/* UPI ID + Copy */}
            <div className="form-group-redesign">
              <label className="form-label-redesign">UPI ID</label>
              <div className="upi-row-redesign">
                <input
                  type="text"
                  value={DISPLAY_UPI}
                  readOnly
                  className="upi-input-redesign"
                />
                <button
                  type="button"
                  className="copy-upi-btn-redesign"
                  onClick={handleCopyUpi}
                  title="Copy UPI ID"
                >
                  📋
                </button>
                {copiedUpi && <span className="copied-badge-redesign">Copied</span>}
              </div>
            </div>
            <div className="form-group-redesign">
              <label className="form-label-redesign">Add Your Roll No.</label>
              <div className="roll-input-wrapper">
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="Enter roll number"
                  className="roll-input-redesign"
                  readOnly
                />
              </div>
            </div>
            <div className="form-group-redesign">
              <label className="form-label-redesign">Add Payment Screenshot</label>
              <div className="file-upload-container-redesign">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="file-input-redesign" 
                  id="file-upload-redesign"
                />
                <label htmlFor="file-upload-redesign" className="file-label-redesign">
                  Choose file
                </label>
                <span className="file-status-redesign">
                  {paymentScreenshot ? paymentScreenshot.name : "No file chosen"}
                </span>
              </div>
            </div>
            {isFirstYearEligible && (
              <div className="form-group-redesign first-year-block">
                <label className="form-label-redesign">Select Hostel (First Year)</label>
                <select
                  className="roll-input-redesign first-year-hostel-select"
                  value={hostelChoice}
                  onChange={e=>setHostelChoice(e.target.value)}
                >
                  <option value="boys">Boys Hostel</option>
                  <option value="girls">Girls Hostel</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="confirm-btn-wrapper">
          <button className="confirm-btn-redesign" onClick={handleConfirmOrder} disabled={isLoading}>
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
