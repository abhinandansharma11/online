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

const socket = io(API_BASE, {
  path: '/socket.io/',
  transports: ["websocket", "polling"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  secure: true,
  rejectUnauthorized: false,
  withCredentials: true
});

export default socket;

