const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
  fcmToken: {
    type: String,
    required: true,
    unique: true
  },
  deviceId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true
  },
  deviceInfo: {
    model: String,
    osVersion: String,
    appVersion: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

deviceTokenSchema.index({ platform: 1, isActive: 1 });
deviceTokenSchema.index({ fcmToken: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
