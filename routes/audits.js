const express = require('express');
const Audit = require('../models/Audit');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   POST /api/audits/create
// @desc    Create new audit
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { serviceType, serviceName, price } = req.body;

    const audit = new Audit({
      user: req.user._id,
      serviceType,
      serviceName,
      price,
      status: 'pending'
    });

    await audit.save();
    await audit.addTimelineEvent('audit_created', 'Audit request submitted', true);

    res.status(201).json({
      success: true,
      message: 'Audit created successfully',
      audit
    });

  } catch (error) {
    console.error('Create audit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating audit'
    });
  }
});

// @route   GET /api/audits/services
// @desc    Get all available audit services
// @access  Public
router.get('/services', (req, res) => {
  const services = [
    {
      id: 1, name: 'AI Validation System Audit', price: '$299.99',
      description: '3-model consensus with OCR processing',
      category: 'Core AI', recoveryRate: '98%', avgRecovery: '$4,247'
    },
    {
      id: 21, name: 'Complete Elite Protection Suite', price: '$1,999.99',
      description: 'All 20+ audit services with AI priority processing',
      category: 'Comprehensive', recoveryRate: '98%', avgRecovery: '$15,789'
    }
  ];

  res.json({
    success: true,
    services
  });
});

module.exports = router;