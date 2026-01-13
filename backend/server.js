require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./Models/db');


const app = express();
const server = http.createServer(app);

// Determine allowed origins - allow all Vercel preview deployments and production
const allowedOrigins = [
  process.env.FRONTEND_BASE_URL,
  'http://localhost:3000',
  'http://localhost:5000',
  /^https:\/\/.*\.vercel\.app$/  // Allow all Vercel deployments
];

const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: allowedOrigins,
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
  origin: allowedOrigins,
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
connectDB().then(() => {
  server.listen(process.env.PORT || 5000, () => {
    console.log('Server running on port', process.env.PORT || 5000);
  });
});

