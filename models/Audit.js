const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: [
      'ai-validation', 'document-enforcement', 'calendar-automation', 'cfpb-automation',
      'zadarma-crm', 'ucc-tracking', 'legal-violation', 'contract-flowchart',
      'partner-referral', 'admin-vault', 'business-loan', 'medical-billing',
      'mortgage-notes', 'auto-insurance', '401k-audit', 'banking-fees',
      'utilities-telecom', 'urla-processing', 'payroll-employment', 'student-loan',
      'complete-suite'
    ]
  },
  serviceName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ai-analysis', 'under-review', 'completed', 'disputed'],
    default: 'pending'
  },
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  recoveryAmount: {
    type: Number,
    default: 0
  },
  timeline: [{
    event: String,
    description: String,
    timestamp: { type: Date, default: Date.now },
    automated: Boolean
  }],
  completedAt: Date
}, {
  timestamps: true
});

// Add timeline event method
AuditSchema.methods.addTimelineEvent = function(event, description, automated = false) {
  this.timeline.push({ event, description, automated });
  return this.save();
};

module.exports = mongoose.model('Audit', AuditSchema);