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

// Create socket with error handling
// Note: Socket.IO does NOT work with Vercel serverless functions
// Only enable for localhost development
let socket = null;

const isLocalhost = API_BASE.includes('localhost');

if (isLocalhost) {
  try {
    socket = io(API_BASE, {
      path: '/socket.io/',
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      secure: false,
      withCredentials: true
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO] Connection error:', error.message);
    });
  } catch (error) {
    console.warn('[Socket.IO] Failed to initialize:', error.message);
    socket = createMockSocket();
  }
} else {
  // On Vercel or production, create a mock socket that doesn't try to connect
  console.log('[Socket.IO] Disabled for Vercel deployment (not supported)');
  socket = createMockSocket();
}

// Create a mock socket object that behaves like real socket but doesn't do anything
function createMockSocket() {
  return {
    on: (event, callback) => {},
    emit: (event, data) => {},
    off: (event, callback) => {},
    disconnect: () => {},
    connected: false,
    connect: () => {},
    close: () => {}
  };
}

export default socket;

