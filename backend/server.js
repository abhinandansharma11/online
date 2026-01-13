console.log('[INIT] Starting application...');
require('dotenv').config();
console.log('[INIT] Environment loaded');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./Models/db');

console.log('[INIT] Dependencies loaded');
const app = express();
const server = http.createServer(app);

// Determine allowed origins
const allowedOrigins = [
  process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5000'
];

// CORS origin checker function
const corsOriginChecker = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  } 
  // Check if origin matches Vercel pattern
  else if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return callback(null, true);
  } 
  // Otherwise reject
  else {
    return callback(null, false);
  }
};

const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: corsOriginChecker,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling'],
  upgradeTimeout: 10000,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourceSharing: true
}));
app.use(cors({
  origin: corsOriginChecker,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the Admin Panel');
});


// Socket.io for real-time orders and targeted updates
const userSocketMap = {};
io.on('connection', (socket) => {
  // Listen for user identification
  socket.on('identify', (userId) => {
    userSocketMap[userId] = socket.id;
  });
  socket.on('disconnect', () => {
    // Remove disconnected socket from map
    for (const [userId, sockId] of Object.entries(userSocketMap)) {
      if (sockId === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});
app.set('io', io); // Make io available in routes
app.set('userSocketMap', userSocketMap);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/students', require('./routes/students'));
app.use('/api/admin', require('./routes/admin'));

// Serve static files from React build (only if build exists)
const path = require('path');
const fs = require('fs');
const buildDir = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  // React SPA fallback (only when build present)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(buildDir, 'index.html'));
    }
    return next();
  });
} else {
  console.log('[INFO] React build folder not found. Run "npm run build" inside frontend for production serving.');
}

// Error handler LAST
app.use(errorHandler);

// MongoDB connection
console.log('[SERVER] Starting server...');
console.log('[SERVER] Connecting to database...');
connectDB().then((success) => {
  console.log('[SERVER] Database connection result:', success);
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log('[SERVER] Server listening on port', port);
  });
}).catch((err) => {
  console.error('[SERVER] Failed to connect to database:', err.message);
  // Still start the server even if DB fails
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log('[SERVER] Server started (DB connection failed, but server is running)');
  });
});

