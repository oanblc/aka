const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');

// Tüm bildirimleri getir
router.get('/', async (req, res) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.json({
      success: true,
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tek bildirim getir
router.get('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yeni bildirim oluştur
router.post('/', async (req, res) => {
  try {
    const { title, body, type, imageUrl, actionUrl, targetAudience } = req.body;

    const notification = new Notification({
      title,
      body,
      type: type || 'announcement',
      imageUrl,
      actionUrl,
      targetAudience: targetAudience || 'all',
      status: 'draft'
    });

    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bildirim güncelle
router.put('/:id', async (req, res) => {
  try {
    const { title, body, type, imageUrl, actionUrl, targetAudience } = req.body;

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { title, body, type, imageUrl, actionUrl, targetAudience },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bildirim sil
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }
    res.json({ success: true, message: 'Bildirim silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bildirim gönder (FCM entegrasyonu için hazır)
router.post('/:id/send', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }

    if (notification.status === 'sent') {
      return res.status(400).json({ success: false, message: 'Bu bildirim zaten gönderilmiş' });
    }

    // Hedef cihazları bul
    const tokenFilter = { isActive: true };
    if (notification.targetAudience !== 'all') {
      tokenFilter.platform = notification.targetAudience;
    }

    const deviceTokens = await DeviceToken.find(tokenFilter);
    const tokenCount = deviceTokens.length;

    // FCM entegrasyonu buraya eklenecek
    // Şimdilik simüle ediyoruz

    /*
    // Firebase Admin SDK ile gönderim örneği:
    const admin = require('firebase-admin');

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: {
        type: notification.type,
        actionUrl: notification.actionUrl || '',
        notificationId: notification._id.toString()
      }
    };

    // Toplu gönderim
    const tokens = deviceTokens.map(d => d.fcmToken);
    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens
    });

    notification.sentCount = response.successCount;
    notification.failedCount = response.failureCount;
    */

    // Şimdilik başarılı sayıyoruz (FCM entegrasyonu yapılınca güncellenecek)
    notification.status = 'sent';
    notification.sentAt = new Date();
    notification.sentCount = tokenCount;
    notification.failedCount = 0;

    await notification.save();

    res.json({
      success: true,
      message: `Bildirim ${tokenCount} cihaza gönderildi`,
      notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// İstatistikler
router.get('/stats/summary', async (req, res) => {
  try {
    const [total, sent, draft, deviceCount] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'sent' }),
      Notification.countDocuments({ status: 'draft' }),
      DeviceToken.countDocuments({ isActive: true })
    ]);

    const lastWeekSent = await Notification.countDocuments({
      status: 'sent',
      sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      stats: {
        total,
        sent,
        draft,
        deviceCount,
        lastWeekSent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== Mobil Uygulama için Device Token Endpoint'leri =====

// Device token kaydet/güncelle
router.post('/device/register', async (req, res) => {
  try {
    const { fcmToken, deviceId, platform, deviceInfo } = req.body;

    if (!fcmToken || !deviceId || !platform) {
      return res.status(400).json({
        success: false,
        message: 'fcmToken, deviceId ve platform zorunludur'
      });
    }

    // Mevcut token'ı güncelle veya yeni oluştur
    const device = await DeviceToken.findOneAndUpdate(
      { fcmToken },
      {
        fcmToken,
        deviceId,
        platform,
        deviceInfo,
        isActive: true,
        lastActiveAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Device token kaldır (uygulama silindiğinde)
router.post('/device/unregister', async (req, res) => {
  try {
    const { fcmToken } = req.body;

    await DeviceToken.findOneAndUpdate(
      { fcmToken },
      { isActive: false }
    );

    res.json({ success: true, message: 'Cihaz kaydı kaldırıldı' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kayıtlı cihazları listele (admin için)
router.get('/devices', async (req, res) => {
  try {
    const { platform } = req.query;

    const filter = { isActive: true };
    if (platform) filter.platform = platform;

    const devices = await DeviceToken.find(filter)
      .sort({ lastActiveAt: -1 })
      .limit(100);

    const stats = await DeviceToken.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      devices,
      platformStats: stats.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
