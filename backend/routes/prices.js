const express = require('express');
const router = express.Router();
const { getCurrentPrices } = require('../services/priceService');
const PriceHistory = require('../models/PriceHistory');
const CachedPrices = require('../models/CachedPrices');
const SourcePriceCache = require('../models/SourcePriceCache');

// Mevcut fiyatları getir (ham kaynak fiyatları)
router.get('/current', (req, res) => {
  try {
    const prices = getCurrentPrices();
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Fiyat getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kaynak fiyatları getir (admin panel için - sadece ham API fiyatları)
router.get('/sources', async (req, res) => {
  try {
    // Memory ve cache'i birleştir - en kapsamlı listeyi döndür
    const priceMap = new Map();

    // Önce cache'den al (eski ama kapsamlı)
    const cached = await SourcePriceCache.findOne({ key: 'source_prices' });
    if (cached && cached.prices) {
      cached.prices.forEach(p => {
        priceMap.set(p.code, {
          code: p.code,
          name: p.name,
          rawAlis: p.rawAlis,
          rawSatis: p.rawSatis
        });
      });
    }

    // Sonra memory'den al (güncel fiyatlarla güncelle)
    const prices = getCurrentPrices();
    const memoryPrices = prices.filter(p => !p.isCustom);
    memoryPrices.forEach(p => {
      priceMap.set(p.code, {
        code: p.code,
        name: p.name,
        rawAlis: p.rawAlis,
        rawSatis: p.rawSatis
      });
    });

    const sourcePrices = Array.from(priceMap.values()).sort((a, b) => a.code.localeCompare(b.code));

    res.json({
      success: true,
      data: sourcePrices,
      lastUpdate: new Date().toISOString(),
      count: sourcePrices.length,
      cacheCount: cached?.prices?.length || 0,
      memoryCount: memoryPrices.length
    });
  } catch (error) {
    console.error('Fiyat getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Belirli bir ürünün fiyat geçmişini getir
router.get('/history/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { hours = 24 } = req.query;

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(hours));

    const history = await PriceHistory.find({
      code,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).limit(1000);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Fiyat geçmişi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Cached fiyatları getir (ilk sayfa yüklemesi için)
router.get('/cached', async (req, res) => {
  try {
    const cached = await CachedPrices.findOne({ key: 'current_prices' });

    if (cached && cached.prices && cached.prices.length > 0) {
      res.json({
        success: true,
        data: {
          prices: cached.prices,
          meta: cached.meta
        },
        updatedAt: cached.updatedAt
      });
    } else {
      // Cache yoksa mevcut fiyatlardan custom olanları döndür
      const prices = getCurrentPrices();
      const customPrices = prices.filter(p => p.isCustom);

      res.json({
        success: true,
        data: {
          prices: customPrices,
          meta: {
            time: new Date().toISOString(),
            maxDisplayItems: customPrices.length
          }
        },
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('Cache fiyat getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

module.exports = router;

