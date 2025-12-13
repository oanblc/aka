const mongoose = require('mongoose');

const cachedPricesSchema = new mongoose.Schema({
  // Tek bir doküman olacak, key ile tanımlı
  key: {
    type: String,
    default: 'current_prices',
    unique: true
  },
  prices: [{
    code: String,
    name: String,
    category: String,
    calculatedAlis: Number,
    calculatedSatis: Number,
    isCustom: Boolean,
    isVisible: Boolean,
    order: Number
  }],
  meta: {
    time: String,
    maxDisplayItems: Number
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Her kayıtta updatedAt güncelle
cachedPricesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CachedPrices', cachedPricesSchema);
