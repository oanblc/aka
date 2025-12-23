const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['campaign', 'announcement', 'price_alert', 'news'],
    default: 'announcement'
  },
  imageUrl: {
    type: String,
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  targetAudience: {
    type: String,
    enum: ['all', 'ios', 'android', 'web'],
    default: 'all'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'failed'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  fcmMessageId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
