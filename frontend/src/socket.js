import { io } from "socket.io-client";

const rawBase = (process.env.REACT_APP_API_BASE || '').trim();
function normalize(base) {
  if (!base) return '';
  let b = base;
  if (!/^https?:\/\//i.test(b)) b = 'http://' + b.replace(/^\/+/, '');
  return b.replace(/\/+$/, '');
}
const API_BASE = normalize(rawBase) || 'http://localhost:5000';

let socketInstance;
function createSocket() {
  return io(API_BASE, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
if (!socketInstance) socketInstance = createSocket();

export default socketInstance;
