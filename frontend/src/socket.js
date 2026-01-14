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

// Create socket with error handling - socket.io may not work on Vercel serverless
let socket = null;

try {
  socket = io(API_BASE, {
    path: '/socket.io/',
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    secure: true,
    rejectUnauthorized: false,
    withCredentials: true,
    timeout: 10000
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.IO] Connection error (this is okay on Vercel):', error.message);
  });

  socket.on('error', (error) => {
    console.warn('[Socket.IO] Socket error:', error);
  });
} catch (error) {
  console.warn('[Socket.IO] Failed to initialize socket:', error.message);
  // Create a mock socket object that doesn't throw errors
  socket = {
    on: () => {},
    emit: () => {},
    off: () => {},
    disconnect: () => {},
    connected: false
  };
}

export default socket;

