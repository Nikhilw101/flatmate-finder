const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { notFoundHandler } = require('./middlewares/notFound.middleware');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const env = require('./config/env');

const app = express();

// Trust reverse proxy (required for Render/Heroku to get real client IPs for rate limiting)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// API Routes
app.use('/api/v1', routes);

// Health Check Endpoint for Deployment Platforms
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
