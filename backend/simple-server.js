const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const { io: socketClient } = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// MongoDB Models
const CustomPrice = require('./models/CustomPrice');
const Settings = require('./models/Settings');
const FamilyCard = require('./models/FamilyCard');
const Article = require('./models/Article');
const Branch = require('./models/Branch');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiyat';
let isMongoConnected = false;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB bağlantısı başarılı');
    isMongoConnected = true;
    loadDataFromMongo();
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    console.log('⚠️ Dosya sistemi kullanılacak');
    loadData();
  });

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Logo yükleme için büyük limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Demo data ve state
let currentPrices = [];
let customPrices = []; // Kullanıcı tarafından oluşturulan fiyatlar
let lastUpdateTime = null; // Son güncelleme zamanı
let settings = {
  maxDisplayItems: 20, // Maksimum görüntülenecek ürün sayısı
  logoBase64: '', // Logo (base64 encoded)
  logoHeight: 48, // Logo yüksekliği (px)
  logoWidth: 'auto' // Logo genişliği ('auto' veya px)
};
let familyCards = []; // NOMANOĞLU ailesi kartları
let articles = []; // Bilgi & Rehber Makaleleri
let branches = []; // Şubeler

// Veri dosyası yolları
const DATA_DIR = path.join(__dirname, 'data');
const CUSTOM_PRICES_FILE = path.join(DATA_DIR, 'customPrices.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const FAMILY_CARDS_FILE = path.join(DATA_DIR, 'familyCards.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const BRANCHES_FILE = path.join(DATA_DIR, 'branches.json');

// Data klasörünü oluştur
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Data klasörü oluşturuldu');
}

// Verileri dosyadan yükle
const loadData = () => {
  try {
    if (fs.existsSync(CUSTOM_PRICES_FILE)) {
      const data = fs.readFileSync(CUSTOM_PRICES_FILE, 'utf8');
      customPrices = JSON.parse(data);
      console.log(`✅ ${customPrices.length} custom fiyat yüklendi`);
    }
  } catch (error) {
    console.error('❌ Custom fiyatlar yüklenemedi:', error.message);
  }

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      settings = JSON.parse(data);
      console.log(`✅ Ayarlar yüklendi`);
    }
  } catch (error) {
    console.error('❌ Ayarlar yüklenemedi:', error.message);
  }

  try {
    if (fs.existsSync(FAMILY_CARDS_FILE)) {
      const data = fs.readFileSync(FAMILY_CARDS_FILE, 'utf8');
      familyCards = JSON.parse(data);
      console.log(`✅ ${familyCards.length} family kart yüklendi`);
    } else {
      // İlk kurulumda default kartları oluştur
      familyCards = [
        { id: '1', label: "1967'den Beri", title: "Yarım asırlık deneyim.", description: "1967'den bugüne güvenilir hizmet anlayışı.", icon: "TrendingUp", order: 1 },
        { id: '2', label: "Geniş Ağ", title: "19 mağaza, 6 üretim tesisi.", description: "Adana, Mersin, Osmaniye ve İstanbul'da geniş hizmet ağı.", icon: "CheckCircle", order: 2 },
        { id: '3', label: "Global Pazar", title: "Uluslararası ihracat.", description: "Birçok ülkeye kaliteli ürün ihracatı.", icon: "Star", order: 3 }
      ];
      saveFamilyCards();
    }
  } catch (error) {
    console.error('❌ Family kartları yüklenemedi:', error.message);
  }

  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const data = fs.readFileSync(ARTICLES_FILE, 'utf8');
      articles = JSON.parse(data);
      console.log(`✅ ${articles.length} makale yüklendi`);
    } else {
      // İlk kurulumda default makaleler oluştur
      articles = [
        { 
          id: '1', 
          category: "Yatırım", 
          title: "Altın Yatırımı Rehberi", 
          description: "Altına yatırım yaparken dikkat edilmesi gereken temel konular.", 
          content: "Altın, tarihin her döneminde değerli bir yatırım aracı olmuştur. Bu rehberde, altın yatırımının temel prensiplerini, avantajlarını ve dikkat edilmesi gereken noktaları detaylı şekilde inceleyeceğiz.\n\n**Neden Altın?**\n\nAltın, ekonomik belirsizlik dönemlerinde güvenli liman olarak kabul edilir. Enflasyona karşı koruma sağlar ve portföy çeşitlendirmesi için idealdir.\n\n**Yatırım Seçenekleri:**\n\n1. **Fiziksel Altın:** Külçe, gram, çeyrek gibi fiziksel altın ürünleri\n2. **Altın Hesabı:** Bankalarda açılan altın hesapları\n3. **Altın Fonu:** Borsa yatırım fonları üzerinden altına yatırım\n\n**Dikkat Edilmesi Gerekenler:**\n\n- Piyasa koşullarını takip edin\n- Uzun vadeli düşünün\n- Portföyünüzün tamamını altına yatırmayın\n- Güvenilir kuyumculardan alım yapın",
          icon: "Coins", 
          order: 1 
        },
        { 
          id: '2', 
          category: "Karşılaştırma", 
          title: "Külçe mi Ziynet mi?", 
          description: "Yatırım aracı olarak külçe altın ve ziynet altını karşılaştırması.", 
          content: "Altın yatırımı yaparken en sık sorulan sorulardan biri: Külçe altın mı, ziynet altını mı almalıyım? Her ikisinin de avantajları ve dezavantajları vardır.\n\n**Külçe Altın:**\n\n**Avantajları:**\n- Daha düşük işçilik maliyeti\n- Has altın (%99.9 saflıkta)\n- Daha likit, kolay alım-satım\n- Yatırım amaçlı tercih edilir\n\n**Dezavantajları:**\n- Saklama sorunu\n- Takı olarak kullanılamaz\n\n**Ziynet Altını:**\n\n**Avantajları:**\n- Hem yatırım hem süs eşyası\n- Günlük kullanılabilir\n- Hediye olarak değerli\n\n**Dezavantajları:**\n- Yüksek işçilik maliyeti\n- Daha düşük saflık (14-22 ayar)\n- Satarken işçilik kaybı\n\n**Sonuç:** Sadece yatırım amaçlıysa külçe, hem kullanım hem yatırım istiyorsanız ziynet altını tercih edilebilir.",
          icon: "Gem", 
          order: 2 
        },
        { 
          id: '3', 
          category: "Piyasa", 
          title: "Döviz Kurları Nasıl Belirlenir?", 
          description: "Döviz kurlarını etkileyen faktörler ve piyasa dinamikleri.", 
          content: "Döviz kurları, ülkelerin para birimlerinin birbirine göre değerini belirler. Peki bu kurlar nasıl oluşur ve ne etkiler?\n\n**Temel Faktörler:**\n\n**1. Arz ve Talep**\nEn temel belirleyici faktör. Bir para birimine olan talep artarsa değeri yükselir.\n\n**2. Faiz Oranları**\nYüksek faiz oranları, o ülkenin para birimine olan talebi artırır.\n\n**3. Enflasyon**\nYüksek enflasyon, para biriminin değerini düşürür.\n\n**4. Ekonomik Göstergeler**\n- GSYH büyümesi\n- İşsizlik oranları\n- Cari açık/fazla\n- Sanayi üretimi\n\n**5. Politik Faktörler**\n- Seçimler\n- Hükümet politikaları\n- Jeopolitik riskler\n\n**6. Merkez Bankası Politikaları**\nPara politikası kararları, faiz değişimleri ve rezerv yönetimi.\n\n**Piyasa Mekanizması:**\n\nDöviz kurları, dünya genelinde 7/24 işlem gören forex piyasalarında belirlenir. Merkez bankaları müdahale edebilse de, genel olarak serbest piyasa koşulları geçerlidir.",
          icon: "TrendingUp", 
          order: 3 
        }
      ];
      saveArticles();
    }
  } catch (error) {
    console.error('❌ Makaleler yüklenemedi:', error.message);
  }

  try {
    if (fs.existsSync(BRANCHES_FILE)) {
      const data = fs.readFileSync(BRANCHES_FILE, 'utf8');
      branches = JSON.parse(data);
      console.log(`✅ ${branches.length} şube yüklendi`);
    }
  } catch (error) {
    console.error('❌ Şubeler yüklenemedi:', error.message);
  }
};

// Verileri kaydet (MongoDB + dosya)
const saveCustomPrices = async () => {
  try {
    // Dosyaya da kaydet (backup)
    fs.writeFileSync(CUSTOM_PRICES_FILE, JSON.stringify(customPrices, null, 2));
    console.log(`💾 ${customPrices.length} custom fiyat dosyaya kaydedildi`);
  } catch (error) {
    console.error('❌ Custom fiyatlar dosyaya kaydedilemedi:', error.message);
  }
};

const saveCustomPriceToMongo = async (price) => {
  if (!isMongoConnected) return;
  try {
    await CustomPrice.findOneAndUpdate(
      { $or: [{ _id: price.id }, { code: price.code }] },
      {
        name: price.name,
        code: price.code,
        category: price.category,
        alisConfig: price.alisConfig,
        satisConfig: price.satisConfig,
        order: price.order,
        isVisible: price.isVisible
      },
      { upsert: true, new: true }
    );
    console.log(`💾 MongoDB: ${price.name} kaydedildi`);
  } catch (error) {
    console.error('❌ MongoDB custom price kayıt hatası:', error.message);
  }
};

const deleteCustomPriceFromMongo = async (id) => {
  if (!isMongoConnected) return;
  try {
    await CustomPrice.findByIdAndDelete(id);
    console.log(`🗑️ MongoDB: Fiyat silindi`);
  } catch (error) {
    console.error('❌ MongoDB custom price silme hatası:', error.message);
  }
};

const saveSettings = async () => {
  try {
    // Dosyaya da kaydet (backup)
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    console.log(`💾 Ayarlar dosyaya kaydedildi`);
  } catch (error) {
    console.error('❌ Ayarlar dosyaya kaydedilemedi:', error.message);
  }
};

const saveSettingsToMongo = async () => {
  if (!isMongoConnected) return;
  try {
    await Settings.findOneAndUpdate({}, settings, { upsert: true });
    console.log(`💾 MongoDB: Ayarlar kaydedildi`);
  } catch (error) {
    console.error('❌ MongoDB ayar kayıt hatası:', error.message);
  }
};

const saveFamilyCards = async () => {
  try {
    fs.writeFileSync(FAMILY_CARDS_FILE, JSON.stringify(familyCards, null, 2));
    console.log(`💾 ${familyCards.length} family kart dosyaya kaydedildi`);
  } catch (error) {
    console.error('❌ Family kartları dosyaya kaydedilemedi:', error.message);
  }
};

const saveFamilyCardToMongo = async (card) => {
  if (!isMongoConnected) return;
  try {
    await FamilyCard.findOneAndUpdate(
      { _id: card.id },
      card,
      { upsert: true, new: true }
    );
    console.log(`💾 MongoDB: Family kart kaydedildi`);
  } catch (error) {
    console.error('❌ MongoDB family card kayıt hatası:', error.message);
  }
};

const saveArticles = async () => {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
    console.log(`💾 ${articles.length} makale dosyaya kaydedildi`);
  } catch (error) {
    console.error('❌ Makaleler dosyaya kaydedilemedi:', error.message);
  }
};

const saveArticleToMongo = async (article) => {
  if (!isMongoConnected) return;
  try {
    await Article.findOneAndUpdate(
      { _id: article.id },
      article,
      { upsert: true, new: true }
    );
    console.log(`💾 MongoDB: Makale kaydedildi`);
  } catch (error) {
    console.error('❌ MongoDB article kayıt hatası:', error.message);
  }
};

const saveBranches = async () => {
  try {
    fs.writeFileSync(BRANCHES_FILE, JSON.stringify(branches, null, 2));
    console.log(`💾 ${branches.length} şube dosyaya kaydedildi`);
  } catch (error) {
    console.error('❌ Şubeler dosyaya kaydedilemedi:', error.message);
  }
};

const saveBranchToMongo = async (branch) => {
  if (!isMongoConnected) return;
  try {
    await Branch.findOneAndUpdate(
      { _id: branch.id },
      branch,
      { upsert: true, new: true }
    );
    console.log(`💾 MongoDB: Şube kaydedildi`);
  } catch (error) {
    console.error('❌ MongoDB branch kayıt hatası:', error.message);
  }
};

// MongoDB'den verileri yükle
const loadDataFromMongo = async () => {
  try {
    // Custom Prices
    const mongoCustomPrices = await CustomPrice.find({}).sort({ order: 1 });
    if (mongoCustomPrices.length > 0) {
      customPrices = mongoCustomPrices.map(p => ({
        id: p._id.toString(),
        name: p.name,
        code: p.code,
        category: p.category,
        alisConfig: p.alisConfig,
        satisConfig: p.satisConfig,
        order: p.order || 0,
        isVisible: p.isVisible !== false
      }));
      console.log(`✅ MongoDB'den ${customPrices.length} custom fiyat yüklendi`);
    } else {
      console.log('⚠️ MongoDB\'de custom fiyat yok, dosyadan yükleniyor...');
      loadData();
      // Dosyadan yüklenen verileri MongoDB'ye kaydet
      if (customPrices.length > 0) {
        for (const price of customPrices) {
          await CustomPrice.findOneAndUpdate(
            { code: price.code },
            price,
            { upsert: true, new: true }
          );
        }
        console.log(`✅ ${customPrices.length} custom fiyat MongoDB'ye aktarıldı`);
      }
    }

    // Settings
    const mongoSettings = await Settings.findOne({});
    if (mongoSettings) {
      settings = {
        maxDisplayItems: mongoSettings.maxDisplayItems || 20,
        logoBase64: mongoSettings.logoBase64 || '',
        logoHeight: mongoSettings.logoHeight || 48,
        logoWidth: mongoSettings.logoWidth || 'auto',
        contactPhone: mongoSettings.contactPhone || '',
        contactEmail: mongoSettings.contactEmail || '',
        contactAddress: mongoSettings.contactAddress || '',
        workingHours: mongoSettings.workingHours || '',
        workingHoursNote: mongoSettings.workingHoursNote || '',
        socialFacebook: mongoSettings.socialFacebook || '',
        socialTwitter: mongoSettings.socialTwitter || '',
        socialInstagram: mongoSettings.socialInstagram || '',
        socialYoutube: mongoSettings.socialYoutube || '',
        socialTiktok: mongoSettings.socialTiktok || '',
        socialWhatsapp: mongoSettings.socialWhatsapp || ''
      };
      console.log(`✅ MongoDB'den ayarlar yüklendi`);
    } else {
      // Dosyadan ayarları yükle ve MongoDB'ye kaydet
      if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
        settings = JSON.parse(data);
        await Settings.create(settings);
        console.log(`✅ Ayarlar MongoDB'ye aktarıldı`);
      }
    }

    // Family Cards
    const mongoFamilyCards = await FamilyCard.find({}).sort({ order: 1 });
    if (mongoFamilyCards.length > 0) {
      familyCards = mongoFamilyCards.map(c => ({
        id: c._id.toString(),
        label: c.label,
        title: c.title,
        description: c.description,
        icon: c.icon,
        order: c.order || 0
      }));
      console.log(`✅ MongoDB'den ${familyCards.length} family kart yüklendi`);
    }

    // Articles
    const mongoArticles = await Article.find({}).sort({ order: 1 });
    if (mongoArticles.length > 0) {
      articles = mongoArticles.map(a => ({
        id: a._id.toString(),
        category: a.category,
        title: a.title,
        description: a.description,
        content: a.content,
        icon: a.icon,
        order: a.order || 0
      }));
      console.log(`✅ MongoDB'den ${articles.length} makale yüklendi`);
    }

    // Branches
    const mongoBranches = await Branch.find({});
    if (mongoBranches.length > 0) {
      branches = mongoBranches.map(b => ({
        id: b._id.toString(),
        name: b.name,
        city: b.city,
        district: b.district,
        address: b.address,
        phone: b.phone,
        email: b.email,
        mapUrl: b.mapUrl,
        workingHours: b.workingHours,
        isActive: b.isActive !== false
      }));
      console.log(`✅ MongoDB'den ${branches.length} şube yüklendi`);
    }

    console.log('✅ Tüm veriler MongoDB\'den yüklendi');
  } catch (error) {
    console.error('❌ MongoDB veri yükleme hatası:', error.message);
    console.log('⚠️ Dosya sisteminden yükleniyor...');
    loadData();
  }
};

// Başlangıçta verileri yükle (MongoDB bağlantısı yoksa)
if (!isMongoConnected) {
  loadData();
}

// Harem Altın WebSocket bağlantısı
const haremSocket = socketClient('wss://socketweb.haremaltin.com', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

haremSocket.on('connect', () => {
  console.log('✅ Harem Altın WebSocket bağlandı');
});

haremSocket.on('disconnect', () => {
  console.log('❌ Harem Altın WebSocket bağlantısı kesildi');
});

// DOĞRU EVENT İSMİ: price_changed
haremSocket.on('price_changed', (data) => {
  console.log('📊 Harem Altın\'dan fiyat güncellemesi geldi');
  console.log('📦 Gelen veri yapısı:', JSON.stringify(data).substring(0, 200));
  
  lastUpdateTime = new Date().toISOString(); // Zamanı kaydet
  
  if (data && data.data) {
    currentPrices = Object.entries(data.data).map(([code, priceData]) => ({
      code,
      name: productNames[code] || code,
      category: categorizeProduct(code),
      rawAlis: parseFloat(priceData.alis),
      rawSatis: parseFloat(priceData.satis),
      calculatedAlis: parseFloat(priceData.alis),
      calculatedSatis: parseFloat(priceData.satis),
      direction: priceData.dir || {},
      isVisible: true,
      order: 0
    }));
    console.log(`✅ ${currentPrices.length} fiyat güncellendi - ${lastUpdateTime}`);
    updatePrices();
  } else if (Array.isArray(data)) {
    // Eğer veri array formatında geliyorsa
    currentPrices = data.map(priceData => ({
      code: priceData.code || priceData.symbol,
      name: productNames[priceData.code || priceData.symbol] || priceData.name,
      category: categorizeProduct(priceData.code || priceData.symbol),
      rawAlis: parseFloat(priceData.alis || priceData.bid),
      rawSatis: parseFloat(priceData.satis || priceData.ask),
      calculatedAlis: parseFloat(priceData.alis || priceData.bid),
      calculatedSatis: parseFloat(priceData.satis || priceData.ask),
      direction: priceData.dir || {},
      isVisible: true,
      order: 0
    }));
    console.log(`✅ ${currentPrices.length} fiyat güncellendi (array) - ${lastUpdateTime}`);
    updatePrices();
  } else {
    console.log('⚠️ Beklenmeyen veri formatı:', typeof data);
  }
});

// Tüm olası event isimlerini dinle
haremSocket.onAny((eventName, ...args) => {
  console.log('📡 Event alındı:', eventName);
  console.log('📦 Data:', JSON.stringify(args).substring(0, 200));
});

// Kategori belirleme
const categorizeProduct = (code) => {
  if (code.includes('ALTIN') || code.includes('CEYREK') || code.includes('YARIM') || 
      code.includes('TEK') || code.includes('ATA') || code.includes('GREMESE') || 
      code.includes('AYAR') || code.includes('ONS') || code.includes('KULCE')) {
    return 'altin';
  } else if (code.includes('GUMUS') || code.includes('XAG')) {
    return 'gumus';
  } else if (code.includes('TRY') || code.includes('USD') || code.includes('EUR') || 
             code.includes('GBP') || code.includes('CHF') || code.includes('JPY')) {
    return 'doviz';
  }
  return 'diger';
};

// İsim mapping
const productNames = {
  'ALTIN': 'Has Altın', 'ONS': 'Ons', 'USDKG': 'USD/KG', 'EURKG': 'EUR/KG',
  'AYAR22': '22 Ayar', 'KULCEALTIN': 'Gram Altın',
  'CEYREK_YENI': 'Yeni Çeyrek', 'CEYREK_ESKI': 'Eski Çeyrek',
  'YARIM_YENI': 'Yeni Yarım', 'YARIM_ESKI': 'Eski Yarım',
  'TEK_YENI': 'Yeni Tam', 'TEK_ESKI': 'Eski Tam',
  'ATA_YENI': 'Yeni Ata', 'ATA_ESKI': 'Eski Ata',
  'GUMUSTRY': 'Gümüş TL', 'XAGUSD': 'Gümüş Ons',
  'USDTRY': 'Dolar', 'EURTRY': 'Euro', 'GBPTRY': 'Sterlin',
  'CHFTRY': 'İsviçre Frangı', 'JPYTRY': 'Japon Yeni'
};

// Demo data oluştur
const createDemoData = () => {
  const demoRaw = {
    'USDTRY': { alis: 34.45, satis: 34.55 },
    'EURTRY': { alis: 37.80, satis: 37.95 },
    'GBPTRY': { alis: 44.20, satis: 44.40 },
    'ALTIN': { alis: 3254.50, satis: 3265.80 },
    'CEYREK_YENI': { alis: 5420.00, satis: 5480.00 },
    'CEYREK_ESKI': { alis: 5380.00, satis: 5440.00 },
    'YARIM_YENI': { alis: 10840.00, satis: 10960.00 },
    'YARIM_ESKI': { alis: 10760.00, satis: 10880.00 },
    'TEK_YENI': { alis: 21680.00, satis: 21920.00 },
    'TEK_ESKI': { alis: 21520.00, satis: 21760.00 },
    'GUMUSTRY': { alis: 42.50, satis: 43.20 },
    'XAGUSD': { alis: 31.20, satis: 31.35 },
    'ONS': { alis: 2654.50, satis: 2658.20 },
    'KULCEALTIN': { alis: 3250.00, satis: 3270.00 },
    'AYAR22': { alis: 2975.00, satis: 2990.00 },
    'AYAR14': { alis: 1890.00, satis: 1910.00 }
  };

  return Object.entries(demoRaw).map(([code, data]) => ({
    code,
    name: productNames[code] || code,
    category: categorizeProduct(code),
    rawAlis: data.alis,
    rawSatis: data.satis,
    calculatedAlis: data.alis,
    calculatedSatis: data.satis,
    direction: {},
    isVisible: true,
    order: 0
  }));
};

// Fiyatları çek
const fetchPrices = async () => {
  try {
    const response = await axios.get('https://canlipiyasalar.haremaltin.com/tmp/altin.json?dil_kodu=tr', {
      timeout: 5000
    });
    
    if (response.data && response.data.data && Object.keys(response.data.data).length > 0) {
      console.log('✅ API\'den veri alındı');
      return Object.entries(response.data.data).map(([code, data]) => ({
        code,
        name: productNames[code] || code,
        category: categorizeProduct(code),
        rawAlis: parseFloat(data.alis),
        rawSatis: parseFloat(data.satis),
        calculatedAlis: parseFloat(data.alis),
        calculatedSatis: parseFloat(data.satis),
        direction: data.dir || {},
        isVisible: true,
        order: 0
      }));
    }
  } catch (error) {
    console.log('⚠️ API hatası:', error.message);
  }
  
  console.log('📊 Demo data kullanılıyor');
  return createDemoData();
};

// Fiyatları güncelle
const updatePrices = async () => {
  if (currentPrices.length === 0) {
    console.log('⚠️ Henüz kaynak fiyat yok, demo data kullanılıyor');
    currentPrices = await fetchPrices();
  }
  
  console.log(`✅ ${currentPrices.length} kaynak fiyat mevcut`);
  
  // Custom fiyatları hesapla
  const calculatedCustomPrices = customPrices.map(custom => {
    const alisSource = currentPrices.find(p => p.code === custom.alisConfig.sourceCode);
    const satisSource = currentPrices.find(p => p.code === custom.satisConfig.sourceCode);
    
    let calculatedAlis = 0;
    let calculatedSatis = 0;
    
    if (alisSource) {
      const alisRawPrice = custom.alisConfig.sourceType === 'alis' 
        ? alisSource.rawAlis 
        : alisSource.rawSatis;
      calculatedAlis = (alisRawPrice * custom.alisConfig.multiplier) + custom.alisConfig.addition;
    }
    
    if (satisSource) {
      const satisRawPrice = custom.satisConfig.sourceType === 'alis'
        ? satisSource.rawAlis
        : satisSource.rawSatis;
      calculatedSatis = (satisRawPrice * custom.satisConfig.multiplier) + custom.satisConfig.addition;
    }
    
    return {
      ...custom,
      rawAlis: alisSource ? (custom.alisConfig.sourceType === 'alis' ? alisSource.rawAlis : alisSource.rawSatis) : 0,
      rawSatis: satisSource ? (custom.satisConfig.sourceType === 'alis' ? satisSource.rawAlis : satisSource.rawSatis) : 0,
      calculatedAlis,
      calculatedSatis,
      direction: {},
      isVisible: true,
      order: custom.order || 0
    };
  });
  
  // Order'a göre sırala
  const sortedPrices = calculatedCustomPrices.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const priceData = {
    meta: { 
      time: new Date().toISOString(),
      maxDisplayItems: settings.maxDisplayItems 
    },
    prices: sortedPrices.slice(0, settings.maxDisplayItems) // Maksimum sayı kadar gönder
  };
  
  io.emit('priceUpdate', priceData);
  console.log(`📡 ${calculatedCustomPrices.length} custom fiyat yayınlandı`);
};

// In-memory coefficients storage
let coefficients = [];

// API endpoints

// Kaynak fiyatları getir (yeni fiyat oluştururken kullanmak için)
app.get('/api/prices/sources', (req, res) => {
  res.json({
    success: true,
    data: currentPrices,
    lastUpdate: lastUpdateTime // Son güncelleme zamanı
  });
});

// Görüntülenen fiyatları getir (anasayfa için)
app.get('/api/prices/current', (req, res) => {
  // Custom fiyatları hesapla ve gönder
  const calculatedCustomPrices = customPrices.map(custom => {
    const alisSource = currentPrices.find(p => p.code === custom.alisConfig.sourceCode);
    const satisSource = currentPrices.find(p => p.code === custom.satisConfig.sourceCode);
    
    let calculatedAlis = 0;
    let calculatedSatis = 0;
    
    if (alisSource) {
      const alisRawPrice = custom.alisConfig.sourceType === 'alis' 
        ? alisSource.rawAlis 
        : alisSource.rawSatis;
      calculatedAlis = (alisRawPrice * custom.alisConfig.multiplier) + custom.alisConfig.addition;
    }
    
    if (satisSource) {
      const satisRawPrice = custom.satisConfig.sourceType === 'alis'
        ? satisSource.rawAlis
        : satisSource.rawSatis;
      calculatedSatis = (satisRawPrice * custom.satisConfig.multiplier) + custom.satisConfig.addition;
    }
    
    return {
      code: custom.code,
      name: custom.name,
      category: custom.category,
      rawAlis: alisSource ? (custom.alisConfig.sourceType === 'alis' ? alisSource.rawAlis : alisSource.rawSatis) : 0,
      rawSatis: satisSource ? (custom.satisConfig.sourceType === 'alis' ? satisSource.rawAlis : satisSource.rawSatis) : 0,
      calculatedAlis,
      calculatedSatis,
      direction: {},
      isVisible: true,
      order: custom.order || 0
    };
  });
  
  // Order'a göre sırala
  const sortedPrices = calculatedCustomPrices.sort((a, b) => (a.order || 0) - (b.order || 0));
  
  res.json({
    success: true,
    data: sortedPrices
  });
});

// Custom fiyatları getir
app.get('/api/custom-prices', (req, res) => {
  // Order'a göre sırala
  const sortedPrices = [...customPrices].sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json({
    success: true,
    data: sortedPrices
  });
});

// Yeni custom fiyat oluştur
app.post('/api/custom-prices', async (req, res) => {
  const newPrice = {
    id: Date.now().toString(),
    ...req.body,
    order: req.body.order !== undefined ? req.body.order : customPrices.length, // Yeni fiyat en sona eklensin
    createdAt: new Date().toISOString()
  };
  customPrices.push(newPrice);
  saveCustomPrices(); // DOSYAYA KAYDET
  await saveCustomPriceToMongo(newPrice); // MONGODB'YE KAYDET
  console.log(`✅ Yeni fiyat oluşturuldu: ${newPrice.name}`);
  res.json({ success: true, data: newPrice });
});

// Custom fiyat güncelle
app.put('/api/custom-prices/:id', async (req, res) => {
  const { id } = req.params;
  const index = customPrices.findIndex(p => p.id === id);

  if (index !== -1) {
    customPrices[index] = { ...customPrices[index], ...req.body, updatedAt: new Date().toISOString() };
    saveCustomPrices(); // DOSYAYA KAYDET
    await saveCustomPriceToMongo(customPrices[index]); // MONGODB'YE KAYDET
    console.log(`✅ Fiyat güncellendi: ${customPrices[index].name}`);

    // Siralama degistiyse WebSocket'e yayinla
    if (req.body.order !== undefined) {
      updatePrices();
    }

    res.json({ success: true, data: customPrices[index] });
  } else {
    res.status(404).json({ success: false, message: 'Fiyat bulunamadı' });
  }
});

// Custom fiyat sil
app.delete('/api/custom-prices/:id', async (req, res) => {
  const { id } = req.params;
  const price = customPrices.find(p => p.id === id);
  customPrices = customPrices.filter(p => p.id !== id);
  saveCustomPrices(); // DOSYAYA KAYDET
  await deleteCustomPriceFromMongo(id); // MONGODB'DEN SIL
  console.log(`✅ Fiyat silindi: ${price?.name || id}`);
  res.json({ success: true, message: 'Fiyat silindi' });
});

// Toplu sıralama güncelleme endpoint'i
app.put('/api/custom-prices/reorder', async (req, res) => {
  const { orders } = req.body; // [{ id: '123', order: 0 }, { id: '456', order: 1 }, ...]

  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ success: false, message: 'orders array required' });
  }

  console.log(`📋 Toplu sıralama güncelleniyor: ${orders.length} öğe`);

  // Tüm order'ları güncelle
  for (const item of orders) {
    const index = customPrices.findIndex(p => p.id === item.id);
    if (index !== -1) {
      customPrices[index].order = item.order;
      customPrices[index].updatedAt = new Date().toISOString();
    }
  }

  // Dosyaya kaydet
  saveCustomPrices();

  // MongoDB'ye kaydet
  if (isMongoConnected) {
    try {
      for (const item of orders) {
        await CustomPrice.findOneAndUpdate(
          { $or: [{ _id: item.id }, { code: customPrices.find(p => p.id === item.id)?.code }] },
          { order: item.order, updatedAt: new Date() }
        );
      }
      console.log(`💾 MongoDB: ${orders.length} sıralama güncellendi`);
    } catch (error) {
      console.error('❌ MongoDB sıralama güncelleme hatası:', error.message);
    }
  }

  // Hemen WebSocket'e yayınla
  updatePrices();

  console.log(`✅ Sıralama güncellendi`);
  res.json({ success: true, message: 'Sıralama güncellendi' });
});

// Ayarları getir
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: settings });
});

// Ayarları güncelle
app.post('/api/settings', async (req, res) => {
  settings = { ...settings, ...req.body };
  saveSettings(); // DOSYAYA KAYDET
  await saveSettingsToMongo(); // MONGODB'YE KAYDET
  console.log(`✅ Ayarlar güncellendi:`, settings);
  res.json({ success: true, data: settings });
});

// Coefficients endpoints
app.get('/api/coefficients', (req, res) => {
  res.json({
    success: true,
    data: coefficients
  });
});

app.post('/api/coefficients/bulk', (req, res) => {
  const { coefficients: newCoefficients } = req.body;
  if (newCoefficients && Array.isArray(newCoefficients)) {
    coefficients = newCoefficients;
    console.log(`✅ ${coefficients.length} katsayı kaydedildi`);
    res.json({ success: true, message: 'Katsayılar kaydedildi' });
  } else {
    res.status(400).json({ success: false, message: 'Geçersiz veri' });
  }
});

app.put('/api/coefficients/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = coefficients.findIndex(c => c._id === id || c.id === id);
  
  if (index !== -1) {
    coefficients[index] = { ...coefficients[index], ...updates };
    res.json({ success: true, data: coefficients[index] });
  } else {
    res.status(404).json({ success: false, message: 'Katsayı bulunamadı' });
  }
});

app.delete('/api/coefficients/:id', (req, res) => {
  const { id } = req.params;
  coefficients = coefficients.filter(c => c._id !== id && c.id !== id);
  res.json({ success: true, message: 'Katsayı silindi' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server çalışıyor',
    prices: currentPrices.length,
    customPrices: customPrices.length,
    lastUpdate: lastUpdateTime,
    mongoConnected: isMongoConnected
  });
});

// ==================== FAMILY CARDS API ====================

// Family kartlarını getir
app.get('/api/family-cards', (req, res) => {
  res.json({ success: true, data: familyCards.sort((a, b) => a.order - b.order) });
});

// Yeni family kartı oluştur
app.post('/api/family-cards', async (req, res) => {
  const newCard = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  familyCards.push(newCard);
  saveFamilyCards();
  await saveFamilyCardToMongo(newCard);
  console.log(`✅ Yeni family kartı oluşturuldu: ${newCard.title}`);
  res.json({ success: true, data: newCard });
});

// Family kartı güncelle
app.put('/api/family-cards/:id', async (req, res) => {
  const { id } = req.params;
  const index = familyCards.findIndex(c => c.id === id);

  if (index !== -1) {
    familyCards[index] = { ...familyCards[index], ...req.body, updatedAt: new Date().toISOString() };
    saveFamilyCards();
    await saveFamilyCardToMongo(familyCards[index]);
    console.log(`✅ Family kartı güncellendi: ${familyCards[index].title}`);
    res.json({ success: true, data: familyCards[index] });
  } else {
    res.status(404).json({ success: false, message: 'Kart bulunamadı' });
  }
});

// Family kartı sil
app.delete('/api/family-cards/:id', async (req, res) => {
  const { id } = req.params;
  const card = familyCards.find(c => c.id === id);
  familyCards = familyCards.filter(c => c.id !== id);
  saveFamilyCards();
  if (isMongoConnected) {
    try { await FamilyCard.findByIdAndDelete(id); } catch(e) {}
  }
  console.log(`✅ Family kartı silindi: ${card?.title || id}`);
  res.json({ success: true, message: 'Kart silindi' });
});

// ==================== ARTICLES API ====================

// Makaleleri getir
app.get('/api/articles', (req, res) => {
  res.json({ success: true, data: articles.sort((a, b) => a.order - b.order) });
});

// Tek makale getir
app.get('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const article = articles.find(a => a.id === id);
  
  if (article) {
    res.json({ success: true, data: article });
  } else {
    res.status(404).json({ success: false, message: 'Makale bulunamadı' });
  }
});

// Yeni makale oluştur
app.post('/api/articles', async (req, res) => {
  const newArticle = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  articles.push(newArticle);
  saveArticles();
  await saveArticleToMongo(newArticle);
  console.log(`✅ Yeni makale oluşturuldu: ${newArticle.title}`);
  res.json({ success: true, data: newArticle });
});

// Makale güncelle
app.put('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const index = articles.findIndex(a => a.id === id);

  if (index !== -1) {
    articles[index] = { ...articles[index], ...req.body, updatedAt: new Date().toISOString() };
    saveArticles();
    await saveArticleToMongo(articles[index]);
    console.log(`✅ Makale güncellendi: ${articles[index].title}`);
    res.json({ success: true, data: articles[index] });
  } else {
    res.status(404).json({ success: false, message: 'Makale bulunamadı' });
  }
});

// Makale sil
app.delete('/api/articles/:id', async (req, res) => {
  const { id } = req.params;
  const article = articles.find(a => a.id === id);
  articles = articles.filter(a => a.id !== id);
  saveArticles();
  if (isMongoConnected) {
    try { await Article.findByIdAndDelete(id); } catch(e) {}
  }
  console.log(`✅ Makale silindi: ${article?.title || id}`);
  res.json({ success: true, message: 'Makale silindi' });
});

// ==================== BRANCHES (ŞUBELER) API ====================

// Tüm şubeleri getir
app.get('/api/branches', (req, res) => {
  res.json({ success: true, data: branches });
});

// Tek bir şube getir
app.get('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const branch = branches.find(b => b.id === id);
  
  if (branch) {
    res.json({ success: true, data: branch });
  } else {
    res.status(404).json({ success: false, message: 'Şube bulunamadı' });
  }
});

// Yeni şube oluştur
app.post('/api/branches', async (req, res) => {
  const newBranch = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  branches.push(newBranch);
  saveBranches();
  await saveBranchToMongo(newBranch);
  console.log(`✅ Yeni şube oluşturuldu: ${newBranch.name}`);
  res.json({ success: true, data: newBranch });
});

// Şube güncelle
app.put('/api/branches/:id', async (req, res) => {
  const { id } = req.params;
  const index = branches.findIndex(b => b.id === id);

  if (index !== -1) {
    branches[index] = { ...branches[index], ...req.body, updatedAt: new Date().toISOString() };
    saveBranches();
    await saveBranchToMongo(branches[index]);
    console.log(`✅ Şube güncellendi: ${branches[index].name}`);
    res.json({ success: true, data: branches[index] });
  } else {
    res.status(404).json({ success: false, message: 'Şube bulunamadı' });
  }
});

// Şube sil
app.delete('/api/branches/:id', async (req, res) => {
  const { id } = req.params;
  const branch = branches.find(b => b.id === id);
  branches = branches.filter(b => b.id !== id);
  saveBranches();
  if (isMongoConnected) {
    try { await Branch.findByIdAndDelete(id); } catch(e) {}
  }
  console.log(`✅ Şube silindi: ${branch?.name || id}`);
  res.json({ success: true, message: 'Şube silindi' });
});

// Auth route (basit)
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    res.json({ success: true, token: 'demo-token' });
  } else {
    res.status(401).json({ message: 'Geçersiz şifre' });
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('👤 Kullanıcı bağlandı:', socket.id);
  
  // İlk bağlantıda CUSTOM fiyatları gönder
  if (customPrices.length > 0 && currentPrices.length > 0) {
    const calculatedCustomPrices = customPrices.map(custom => {
      const alisSource = currentPrices.find(p => p.code === custom.alisConfig.sourceCode);
      const satisSource = currentPrices.find(p => p.code === custom.satisConfig.sourceCode);
      
      let calculatedAlis = 0;
      let calculatedSatis = 0;
      
      if (alisSource) {
        const alisRawPrice = custom.alisConfig.sourceType === 'alis' 
          ? alisSource.rawAlis 
          : alisSource.rawSatis;
        calculatedAlis = (alisRawPrice * custom.alisConfig.multiplier) + custom.alisConfig.addition;
      }
      
      if (satisSource) {
        const satisRawPrice = custom.satisConfig.sourceType === 'alis'
          ? satisSource.rawAlis
          : satisSource.rawSatis;
        calculatedSatis = (satisRawPrice * custom.satisConfig.multiplier) + custom.satisConfig.addition;
      }
      
      return {
        code: custom.code,
        name: custom.name,
        category: custom.category,
        rawAlis: alisSource ? (custom.alisConfig.sourceType === 'alis' ? alisSource.rawAlis : alisSource.rawSatis) : 0,
        rawSatis: satisSource ? (custom.satisConfig.sourceType === 'alis' ? satisSource.rawAlis : satisSource.rawSatis) : 0,
        calculatedAlis,
        calculatedSatis,
        direction: {},
        isVisible: true,
        order: custom.order || 0
      };
    });
    
    // Order'a göre sırala
    const sortedPrices = calculatedCustomPrices.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    socket.emit('priceUpdate', {
      meta: { 
        time: new Date().toISOString(),
        maxDisplayItems: settings.maxDisplayItems 
      },
      prices: sortedPrices.slice(0, settings.maxDisplayItems)
    });
    console.log(`📤 ${calculatedCustomPrices.length} CUSTOM fiyat gönderildi (ilk bağlantı)`);
  } else {
    console.log('⚠️ Henüz custom fiyat yok veya kaynak fiyatlar yüklenmedi');
  }
  
  socket.on('disconnect', () => {
    console.log('👋 Kullanıcı ayrıldı:', socket.id);
  });
});

// İlk veriyi çek (fallback olarak)
updatePrices();

// Periyodik kontrol (WebSocket başarısız olursa) ve custom fiyatları güncelle
setInterval(async () => {
  if (currentPrices.length === 0) {
    console.log('⚠️ WebSocket veri gelmedi, fallback çalışıyor');
    await updatePrices();
  } else if (customPrices.length > 0) {
    // Kaynak fiyatlar varsa custom fiyatları güncelle
    updatePrices();
  }
}, 5000); // 5 saniyede bir güncelle

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});

