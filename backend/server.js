const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB bağlantısı (opsiyonel)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => {
  console.warn('⚠️ MongoDB bağlantı hatası (devam ediliyor):', err.message);
  // MongoDB olmadan da çalış
});

// Routes
const authRoutes = require('./routes/auth');
const priceRoutes = require('./routes/prices');
const coefficientRoutes = require('./routes/coefficients');
const alarmRoutes = require('./routes/alarms');
const familyCardsRoutes = require('./routes/familyCards');
const articlesRoutes = require('./routes/articles');
const branchesRoutes = require('./routes/branches');
const settingsRoutes = require('./routes/settings');
const notificationsRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/coefficients', coefficientRoutes);
app.use('/api/alarms', alarmRoutes);
// customPricesRoutes io'ya ihtiyaç duyduğu için factory fonksiyon olarak çağrılıyor
app.use('/api/custom-prices', require('./routes/customPrices')(io));
app.use('/api/family-cards', familyCardsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server çalışıyor' });
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('👤 Yeni kullanıcı bağlandı:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 Kullanıcı ayrıldı:', socket.id);
  });
});

// WebSocket ve Polling servisini başlat
const priceService = require('./services/priceService');

// MongoDB bağlantısından bağımsız olarak çalıştır
setTimeout(() => {
  console.log('🔄 Price service başlatılıyor...');
  priceService.startPolling(io);
}, 2000);

// Alarm kontrolünü başlat (opsiyonel)
try {
  const alarmService = require('./services/alarmService');
  alarmService.startAlarmChecker(io);
} catch (err) {
  console.log('⚠️ Alarm servisi başlatılamadı (MongoDB gerekli)');
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});

module.exports = { io };

