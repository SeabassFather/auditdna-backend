const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Crash protection - handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

const app = express();

// CRITICAL: Trust proxy for Render deployment
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting with proper proxy handling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for testing
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Important for Render
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(15 * 60)
    });
  }
});
app.use('/api/', limiter);

// CORS configuration for production
app.use(cors({
  origin: [
    'https://auditdna.org',
    'https://frontend-auditdna-elite.netlify.app',
    'http://localhost:3000',
    'https://auditdna-backend.onrender.com',
    /\.netlify\.app$/,
    /\.onrender\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Database connection with robust error handling
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditdna';

async function connectDatabase() {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    console.log('🗄️ MongoDB Connected Successfully');
    console.log(`🔗 Database: ${mongoURI.includes('mongodb.net') ? 'PRODUCTION ATLAS' : 'LOCAL'}`);
    
    // Test the connection
    await mongoose.connection.db.admin().ping();
    console.log('📡 Database ping successful');
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.error('Full error:', error);
    
    // Don't exit - let the app run without database for debugging
    console.log('⚠️ Continuing without database connection...');
  }
}

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔌 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Graceful shutdown in