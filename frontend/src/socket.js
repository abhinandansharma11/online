import { io } from "socket.io-client";

let API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

if (!API_BASE) {
  console.error("REACT_APP_API_BASE is not defined");
}

// Ensure API_BASE is an absolute URL and remove /api suffix for Socket.IO
if (!API_BASE.startsWith("http://") && !API_BASE.startsWith("https://")) {
  API_BASE = "https://" + API_BASE;
}

// Remove /api suffix if present for Socket.IO
if (API_BASE.endsWith("/api")) {
  API_BASE = API_BASE.slice(0, -4);
} else if (API_BASE.endsWith("/api/")) {
  API_BASE = API_BASE.slice(0, -5);
}

// Check if we're on Vercel (socket.io doesn't work with serverless)
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

// Create socket with autoConnect disabled if on Vercel
let socket = null;

try {
  socket = io(API_BASE, {
    path: '/socket.io/',
    transports: ["polling", "websocket"],
    autoConnect: !isVercel, // Don't auto-connect on Vercel
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 3000,
    secure: true,
    rejectUnauthorized: false,
    withCredentials: true,
    timeout: 5000
  });

  if (isVercel) {
    console.log('[Socket.IO] Disabled on Vercel (serverless limitation)');
  }

  socket.on('connect_error', (error) => {
    if (isVercel) {
      console.warn('[Socket.IO] Disabled on Vercel - real-time features unavailable');
    } else {
      console.error('[Socket.IO] Connection error:', error);
    }
  });

} catch (error) {
  console.warn('[Socket.IO] Failed to initialize:', error.message);
  // Create a mock socket object that gracefully handles all operations
  socket = {
    on: () => {},
    emit: () => {},
    off: () => {},
    disconnect: () => {},
    connected: false,
    connect: () => {}
  };
}

export default socket;

