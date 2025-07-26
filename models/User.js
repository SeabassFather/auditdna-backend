const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    match: [/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  area: {
    type: String,
    enum: ['ai-validation', 'mortgage', 'medical', 'banking', 'automotive', 'employment', 'retirement', 'utilities', 'education', 'legal', 'business', 'comprehensive'],
    default: 'comprehensive'
  },
  permission: {
    type: Boolean,
    required: true,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'partner', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: 'active'
  },
  badges: [{
    type: String,
    enum: ['Consumer Advocate', 'Financial Watchdog', 'Transparency Champion', 'Rights Defender']
  }],
  totalRecovery: {
    type: Number,
    default: 0
  },
  auditsCompleted: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
UserSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', UserSchema);