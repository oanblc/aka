const mongoose = require('mongoose');

const sourcePriceCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'source_prices',
    unique: true
  },
  prices: [{
    code: String,
    name: String,
    rawAlis: Number,
    rawSatis: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

sourcePriceCacheSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SourcePriceCache', sourcePriceCacheSchema);
