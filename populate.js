const fs = require('fs');
const path = require('path');

const writeContent = (filePath, content) => {
    fs.writeFileSync(path.join(__dirname, filePath), content.trim() + '\n');
};

writeContent('backend/src/server.js', `
require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(\`Server running on port \${PORT}\`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
`);

writeContent('backend/src/app.js', `
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { notFoundHandler } = require('./middlewares/notFound.middleware');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
`);

writeContent('backend/src/routes/index.js', `
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const listingsRoutes = require('./listings.routes');
const interestsRoutes = require('./interests.routes');
const chatsRoutes = require('./chats.routes');
const notificationsRoutes = require('./notifications.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/listings', listingsRoutes);
router.use('/interests', interestsRoutes);
router.use('/chats', chatsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
`);

const routeFiles = [
    'auth.routes.js', 'users.routes.js', 'listings.routes.js', 
    'interests.routes.js', 'chats.routes.js', 'notifications.routes.js', 'admin.routes.js'
];

routeFiles.forEach(file => {
    writeContent('backend/src/routes/' + file, \`
const express = require('express');
const router = express.Router();

// Define routes here
// router.get('/', controller.method);

module.exports = router;
\`);
});

writeContent('backend/src/config/db.js', \`
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connection placeholder');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
\`);

writeContent('backend/src/config/socket.js', \`
const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);
        
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
\`);

writeContent('backend/src/middlewares/error.middleware.js', \`
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
\`);

writeContent('backend/src/middlewares/notFound.middleware.js', \`
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API Route Not Found'
    });
};

module.exports = { notFoundHandler };
\`);

console.log('Base connections added successfully');
