import { io } from "socket.io-client";

const API_BASE = process.env.REACT_APP_API_BASE;

if (!API_BASE) {
  console.error("REACT_APP_API_BASE is not defined");
}

const socket = io(API_BASE, {
  transports: ["websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;

