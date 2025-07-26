const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Fix X-Forwarded-For error for Render
const PORT = process.env.PORT || 1000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration - UPDATED FOR PRODUCTION
app.use(cors({
  origin: [
    'https://auditdna.org', 
    'http://localhost:3000',
    'https://auditdna-backend.onrender.com'
  ],
  credentials: true
}));

// Rest of your code stays the same...