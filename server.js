const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['https://auditdna.org', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: true
});
app.use('/api/', limiter);

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auditdna';
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/audits', require('./routes/audits'));
} catch (error) {
  console.log('Route error:', error.message);
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AuditDNA ELITE 2.0 Backend Running',
    timestamp: new Date().toISOString(),
    modules: 'All 20+ Elite Modules Active',
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'AuditDNA ELITE 2.0 API Server',
    status: 'Operational'
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Server Error' });
});

app.listen(PORT, () => {
  console.log('AuditDNA Backend running on port', PORT);
});

module.exports = app;
