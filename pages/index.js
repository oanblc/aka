import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Bell, Search, TrendingUp, TrendingDown, DollarSign, Euro, Coins, Gem, Star, Maximize2, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Youtube, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Home() {
  const { prices: websocketPrices, isConnected, lastUpdate: wsLastUpdate } = useWebSocket();
  const { logoBase64, logoHeight, logoWidth, isLoaded: logoLoaded } = useSettings();
  const [prices, setPrices] = useState([]);
  const previousPricesRef = useRef([]); // Önceki fiyatları sakla
  const [priceOrder, setPriceOrder] = useState([]); // Fiyat sıralamasını sabit tut
  const [isInitialLoad, setIsInitialLoad] = useState(true); // İlk yükleme durumu
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [nearestBranch, setNearestBranch] = useState(null);
  const [showAppBanner, setShowAppBanner] = useState(true);
  const [highlightedPrices, setHighlightedPrices] = useState({});
  
  // İçerik state'leri
  const [familyCards, setFamilyCards] = useState([]);
  const [articles, setArticles] = useState([]);

  // WebSocket'ten gelen fiyatları güncelle - SADECE CUSTOM FİYATLARI GÖSTER
  useEffect(() => {
    // websocketPrices geçerli ve dolu olmalı
    if (websocketPrices && Array.isArray(websocketPrices) && websocketPrices.length > 0) {
      // Ana sayfada sadece custom fiyatları göster
      const customPrices = websocketPrices.filter(p => p.isCustom === true);

      // Sadece geçerli custom fiyatlar varsa güncelle
      if (customPrices.length > 0) {
        // İlk yüklemede sıralamayı belirle ve kaydet
        if (isInitialLoad) {
          const sortedPrices = [...customPrices].sort((a, b) => (a.order || 0) - (b.order || 0));
          setPriceOrder(sortedPrices.map(p => p.code));
          setIsInitialLoad(false);
        }

        // Fiyat değişimlerini tespit et ve highlight et
        const newHighlighted = {};
        customPrices.forEach(newPrice => {
          const oldPrice = previousPricesRef.current.find(p => p.code === newPrice.code);
          if (oldPrice && (oldPrice.calculatedAlis !== newPrice.calculatedAlis || oldPrice.calculatedSatis !== newPrice.calculatedSatis)) {
            newHighlighted[newPrice.code] = true;
            // 1 saniye sonra highlight'ı kaldır
            setTimeout(() => {
              setHighlightedPrices(prev => ({ ...prev, [newPrice.code]: false }));
            }, 1000);
          }
        });

        if (Object.keys(newHighlighted).length > 0) {
          setHighlightedPrices(prev => ({ ...prev, ...newHighlighted }));
        }

        // Fiyatları güncelle ve ref'e kaydet
        setPrices(customPrices);
        previousPricesRef.current = customPrices;
        setLastUpdate(new Date());
        console.log(`📊 Ana sayfa: ${customPrices.length} custom fiyat gösteriliyor (${websocketPrices.length} toplam fiyat)`);
      } else if (previousPricesRef.current.length > 0) {
        // Boş custom fiyat gelirse önceki fiyatları koru
        console.log('⚠️ Boş custom fiyat, önceki fiyatlar korunuyor');
        setPrices(previousPricesRef.current);
      }
    } else if (previousPricesRef.current.length > 0) {
      // WebSocket verisi boş/geçersiz gelirse önceki fiyatları koru
      console.log('⚠️ WebSocket verisi boş, önceki fiyatlar korunuyor');
      setPrices(previousPricesRef.current);
    }
  }, [websocketPrices]);

  // Son güncellemeden bu yana geçen süreyi hesapla
  useEffect(() => {
    const updateTimeSince = () => {
      if (!lastUpdate) {
        setTimeSinceUpdate('');
        return;
      }

      const now = new Date();
      const diffMs = now - lastUpdate;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 5) {
        setTimeSinceUpdate('Şimdi güncellendi');
      } else if (diffSec < 60) {
        setTimeSinceUpdate(`${diffSec} saniye önce`);
      } else if (diffMin < 60) {
        setTimeSinceUpdate(`${diffMin} dakika önce`);
      } else {
        setTimeSinceUpdate(`${diffHour} saat önce`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    setMounted(true);
    // LocalStorage'dan favorileri yükle
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // App banner kapatıldı mı kontrol et
    const appBannerClosed = localStorage.getItem('appBannerClosed');
    if (appBannerClosed === 'true') {
      setShowAppBanner(false);
    }

    // Alarm sayısını yükle
    const loadAlarmCount = () => {
      const savedAlarms = localStorage.getItem('priceAlarms');
      if (savedAlarms) {
        const alarms = JSON.parse(savedAlarms);
        const activeCount = alarms.filter(a => !a.triggered).length;
        setActiveAlarmsCount(activeCount);
      }
    };
    loadAlarmCount();

    // Her 5 saniyede bir alarm sayısını güncelle
    const interval = setInterval(loadAlarmCount, 5000);

    // Family Cards'ı yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')+'/api/family-cards')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFamilyCards(data.data || []);
        }
      })
      .catch(err => console.error('Family cards yükleme hatası:', err));

    // Articles'ı yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')+'/api/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticles(data.data || []);
        }
      })
      .catch(err => console.error('Articles yükleme hatası:', err));

    // En yakın şubeyi yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')+'/api/branches')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // İlk şubeyi varsayılan olarak göster
          setNearestBranch(data.data[0]);
        }
      })
      .catch(err => console.error('Şube yükleme hatası:', err));

    return () => clearInterval(interval);
  }, []);

  // Favorileri kaydet
  const toggleFavorite = (code) => {
    let newFavorites;
    if (favorites.includes(code)) {
      newFavorites = favorites.filter(f => f !== code);
    } else {
      newFavorites = [...favorites, code];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // App banner'ı kapat
  const closeAppBanner = () => {
    setShowAppBanner(false);
    localStorage.setItem('appBannerClosed', 'true');
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  // Featured 3 cards
  const featured = [
    prices.find(p => p.code === 'USDTRY') || { code: 'USDTRY', name: 'Amerikan Doları', calculatedSatis: 0, calculatedAlis: 0 },
    prices.find(p => p.code === 'EURTRY') || { code: 'EURTRY', name: 'Euro', calculatedSatis: 0, calculatedAlis: 0 },
    prices.find(p => p.code === 'GBPTRY') || { code: 'GBPTRY', name: 'İngiliz Sterlini', calculatedSatis: 0, calculatedAlis: 0 }
  ];

  // Sabit sıralamayı kullanarak filtrele - kayma olmasın
  const filteredPrices = prices
    .filter(p => {
      if (showOnlyFavorites && !favorites.includes(p.code)) return false;
      if (filter !== 'all' && p.category !== filter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Eğer sabit sıralama varsa onu kullan, yoksa order'a göre sırala
      if (priceOrder.length > 0) {
        const indexA = priceOrder.indexOf(a.code);
        const indexB = priceOrder.indexOf(b.code);
        // Yeni ürünler sona eklensin
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }
      return (a.order || 0) - (b.order || 0);
    });

  const getChangePercent = (code) => {
    if (!mounted) return 0;
    const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const change = ((hash % 200) / 100 - 1).toFixed(2);
    return parseFloat(change);
  };

  const getIcon = (code) => {
    if (code.includes('USD')) return <DollarSign size={18} strokeWidth={2} />;
    if (code.includes('EUR')) return <Euro size={18} strokeWidth={2} />;
    if (code.includes('ALTIN') || code.includes('GOLD') || code.includes('ONS')) return <Coins size={18} strokeWidth={2} />;
    if (code.includes('GUMUS') || code.includes('SILVER')) return <Gem size={18} strokeWidth={2} />;
    return <DollarSign size={18} strokeWidth={2} />;
  };

  const getIconForFamily = (iconName, size = 16) => {
    switch(iconName) {
      case 'TrendingUp': return <TrendingUp size={size} className="text-gray-900" strokeWidth={2} />;
      case 'CheckCircle': return <CheckCircle size={size} className="text-gray-900" strokeWidth={2} />;
      case 'Star': return <Star size={size} className="text-gray-900" strokeWidth={2} />;
      case 'Coins': return <Coins size={size} className="text-gray-900" strokeWidth={2} />;
      default: return <TrendingUp size={size} className="text-gray-900" strokeWidth={2} />;
    }
  };

  const getIconForArticle = (iconName, size = 20) => {
    switch(iconName) {
      case 'Coins': return <Coins size={size} className="text-gray-900" strokeWidth={2} />;
      case 'Gem': return <Gem size={size} className="text-gray-900" strokeWidth={2} />;
      case 'TrendingUp': return <TrendingUp size={size} className="text-gray-900" strokeWidth={2} />;
      case 'CheckCircle': return <CheckCircle size={size} className="text-gray-900" strokeWidth={2} />;
      case 'Star': return <Star size={size} className="text-gray-900" strokeWidth={2} />;
      case 'DollarSign': return <DollarSign size={size} className="text-gray-900" strokeWidth={2} />;
      default: return <Coins size={size} className="text-gray-900" strokeWidth={2} />;
    }
  };

  return (
    <>
      <Head>
        <title>HAREM - Canlı Döviz ve Altın Fiyatları</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          /* Scroll bar stilleri */
          .price-table-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .price-table-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .price-table-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .price-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          /* Tam ekran modu */
          #price-table-container:fullscreen {
            background: white;
            padding: 2rem;
            overflow-y: auto;
          }
          #price-table-container:fullscreen .fullscreen-hide {
            display: none !important;
          }
          #price-table-container:fullscreen .price-table-content {
            max-width: 100%;
            margin: 0 auto;
          }
          #price-table-container:fullscreen .price-table-scroll {
            max-height: calc(100vh - 8rem);
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Top Navbar - Elegant Gold Theme */}
        <nav className="sticky top-0 z-40 fullscreen-hide shadow-sm backdrop-blur-md bg-opacity-95" style={{backgroundColor: '#f7de00', borderBottom: '2px solid #d4c000'}}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Logo"
                    className="object-contain transition-transform hover:scale-105"
                    style={{
                      height: `${logoHeight}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxWidth: '300px'
                    }}
                  />
                ) : logoLoaded ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full blur-md opacity-30" style={{backgroundColor: '#f7de00'}}></div>
                      <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
                        <circle cx="20" cy="20" r="18" fill="#f7de00" stroke="#1f2937" strokeWidth="2"/>
                        <circle cx="20" cy="20" r="12" fill="none" stroke="#1f2937" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'serif', letterSpacing: '0.5px'}}>NOMANOĞLU</h1>
                      <p className="text-xs text-gray-800 font-semibold tracking-wider">Kuyumculuk</p>
                    </div>
                  </>
                ) : (
                  <div style={{ height: `${logoHeight}px`, minWidth: '150px' }}></div>
                )}
              </Link>

              {/* Nav Links - Center */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/" className="px-5 py-2.5 text-sm font-semibold text-gray-900 border-b-2 border-gray-900 rounded-t-lg transition-all" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
                  Anasayfa
                </Link>
                <Link href="/piyasalar" className="px-5 py-2.5 text-sm font-medium text-gray-900 hover:text-gray-900 rounded-t-lg transition-all hover:bg-white/40">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-5 py-2.5 text-sm font-medium text-gray-900 hover:text-gray-900 rounded-t-lg transition-all hover:bg-white/40">
                  <span>Alarmlar</span>
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-5 py-2.5 text-sm font-medium text-gray-900 hover:text-gray-900 rounded-t-lg transition-all hover:bg-white/40">
                  İletişim
                </Link>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                <a
                  href="https://wa.me/905322904601"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-900 text-white rounded-lg transition-all group"
                >
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm font-semibold hidden sm:inline">WhatsApp Destek</span>
                  <span className="text-sm font-semibold sm:hidden">Destek</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Fiyat Tablosu + Sağ Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sol: Fiyat Tablosu */}
            <div className="lg:col-span-2" id="price-table-container">
              <div className="price-table-content">
              {/* Favorilerim Başlık */}
              {showOnlyFavorites && (
                <div className="mb-6 fullscreen-hide">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                    <Star size={24} className="fill-amber-500 text-amber-500" strokeWidth={2} />
                    <span>Favorilerim</span>
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {favorites.length === 0 
                      ? 'Henüz favori eklemediniz. Fiyatların yanındaki yıldıza tıklayarak favori ekleyebilirsiniz.'
                      : `${favorites.length} favori fiyat görüntüleniyor`
                    }
                  </p>
                </div>
              )}

          {/* Filters & Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 fullscreen-hide">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setShowOnlyFavorites(true); setFilter('all'); }}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                      showOnlyFavorites
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={showOnlyFavorites ? {backgroundColor: '#f7de00', color: '#1f2937', border: '1px solid #1f2937'} : {}}
                  >
                  <Star size={14} strokeWidth={2} className={favorites.length > 0 && showOnlyFavorites ? 'fill-gray-900 text-gray-900' : favorites.length > 0 ? 'fill-amber-500 text-amber-500' : ''} />
                  <span>Favoriler</span>
                  {favorites.length > 0 && (
                    <span className="text-xs font-bold">
                      ({favorites.length})
                    </span>
                  )}
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Arama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-0 rounded text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Price Table - Paribu Style */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Body */}
            {isInitialLoad && prices.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-gray-500 mt-3 text-sm">Fiyatlar yükleniyor...</p>
              </div>
            ) : filteredPrices.length === 0 && (showOnlyFavorites || search) ? (
              <div className="text-center py-12">
                <Star size={40} className="mx-auto text-gray-300 mb-3" strokeWidth={2} />
                <p className="text-gray-600 text-sm">
                  {showOnlyFavorites
                    ? 'Henüz favori eklemediniz'
                    : 'Sonuç bulunamadı'
                  }
                </p>
                    {showOnlyFavorites && (
                      <button
                        onClick={() => setShowOnlyFavorites(false)}
                        className="mt-3 px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}
                      >
                        Tüm Fiyatlara Dön
                      </button>
                    )}
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-3 px-4 py-2 text-sm font-medium rounded transition-colors"
                        style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}
                      >
                        Aramayı Temizle
                      </button>
                    )}
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-gray-500 mt-3 text-sm">Fiyatlar güncelleniyor...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto price-table-scroll">
                {/* Tablo Başlıkları */}
                <div className="grid grid-cols-12 gap-4 px-6 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm items-center" style={{ height: '52px' }}>
                  <div className="col-span-4">Ürün Adı</div>
                  <div className="col-span-3 text-right">Alış Fiyatı</div>
                  <div className="col-span-3 text-right">Satış Fiyatı</div>
                  <div className="col-span-2 text-center">Değişim</div>
                </div>

                {/* Fiyat Satırları */}
                <div className="divide-y divide-gray-200">
                  {filteredPrices.map((price) => {
                    const currentTime = new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
                    const isFavorite = favorites.includes(price.code);
                    const isRising = price.direction && (price.direction.alis_dir === 'up' || price.direction.satis_dir === 'up');
                    const isFalling = price.direction && (price.direction.alis_dir === 'down' || price.direction.satis_dir === 'down');

                    return (
                      <div
                        key={price.code}
                        className={`grid grid-cols-12 gap-4 px-6 hover:bg-gray-50 transition-all duration-300 items-center border-b border-gray-100 ${
                          highlightedPrices[price.code] ? 'bg-yellow-50/50' : ''
                        }`}
                        style={{ height: '72px' }}
                      >
                        {/* Ürün Adı */}
                        <div className="col-span-4 flex items-center space-x-3">
                          <button
                            onClick={() => toggleFavorite(price.code)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Star 
                              size={18} 
                              strokeWidth={2}
                              className={`transition-all ${
                                isFavorite 
                                  ? 'fill-amber-500 text-amber-500' 
                                  : 'text-gray-300 hover:text-amber-400'
                              }`}
                            />
                          </button>
                          
                          <div>
                            <p className="text-gray-900 font-bold text-base">{price.code}</p>
                            <p className="text-gray-500 text-xs">{price.name}</p>
                          </div>
                        </div>

                        {/* Alış Fiyatı */}
                        <div className="col-span-3 text-right">
                          <span className="text-gray-900 font-bold text-xl tabular-nums">
                            ₺{formatPrice(price.calculatedAlis)}
                          </span>
                        </div>

                        {/* Satış Fiyatı */}
                        <div className="col-span-3 text-right">
                          <span className="text-gray-900 font-bold text-xl tabular-nums">
                            ₺{formatPrice(price.calculatedSatis)}
                          </span>
                        </div>

                        {/* Değişim */}
                        <div className="col-span-2 flex justify-center">
                          {isRising && (
                            <div className="p-3 rounded-lg bg-green-100">
                              <TrendingUp size={24} strokeWidth={2.5} className="text-green-600" />
                            </div>
                          )}
                          {isFalling && (
                            <div className="p-3 rounded-lg bg-red-100">
                              <TrendingDown size={24} strokeWidth={2.5} className="text-red-600" />
                            </div>
                          )}
                          {!isRising && !isFalling && (
                            <div className="p-3 rounded-lg bg-gray-100">
                              <span className="text-gray-400 font-medium text-lg">—</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Table Footer */}
            {filteredPrices.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 text-center fullscreen-hide">
                  <button
                    id="fullscreen-btn"
                    onClick={() => {
                      const priceTable = document.getElementById('price-table-container');
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        priceTable.requestFullscreen();
                      }
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 font-medium rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}
                    aria-label="Tam ekran moduna geç"
                  >
                    <Maximize2 size={18} strokeWidth={2} />
                    <span className="text-base">Tam Ekran Görünüm</span>
                  </button>
              </div>
            )}
          </div>
              </div>
            </div>

            {/* Sağ: İletişim & Sosyal Medya */}
            <div className="lg:col-span-1 space-y-4 fullscreen-hide">
              {/* İletişim Bilgileri */}
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-full">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                  İletişim Bilgileri
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-gray-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                      <p className="text-sm font-semibold text-gray-900">+90 (XXX) XXX XX XX</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-gray-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">E-posta</p>
                      <p className="text-sm font-semibold text-gray-900">info@nomanoglu.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-gray-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Adres</p>
                      <p className="text-sm font-semibold text-gray-900">İstanbul, Türkiye</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-gray-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Çalışma Saatleri</p>
                      <p className="text-sm font-semibold text-gray-900">Pzt - Cmt: 09:00 - 19:00</p>
                      <p className="text-xs text-gray-500 mt-1">Pazar: Kapalı</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Sosyal Medya
                  </h4>
                  <div className="flex items-center space-x-2">
                    <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group">
                      <Facebook size={18} className="text-gray-600 group-hover:text-blue-600" strokeWidth={2} />
                    </a>
                    <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group">
                      <Twitter size={18} className="text-gray-600 group-hover:text-sky-500" strokeWidth={2} />
                    </a>
                    <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group">
                      <Instagram size={18} className="text-gray-600 group-hover:text-pink-600" strokeWidth={2} />
                    </a>
                    <a href="#" className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group">
                      <Youtube size={18} className="text-gray-600 group-hover:text-red-600" strokeWidth={2} />
                    </a>
                  </div>
                </div>

                {/* En Yakın Şube */}
                {nearestBranch && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      En Yakın Şube
                    </h4>
                    <div className="rounded-lg p-4 border-2" style={{backgroundColor: '#fffaeb', borderColor: '#f7de00'}}>
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#f7de00'}}>
                          <MapPin size={20} className="text-gray-900" strokeWidth={2} />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-bold text-gray-900 mb-1">{nearestBranch.name}</h5>
                          <p className="text-xs text-gray-800 font-semibold">{nearestBranch.city}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <p className="text-xs text-gray-700 leading-relaxed">{nearestBranch.address}</p>
                        
                        {nearestBranch.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone size={12} className="text-gray-900" strokeWidth={2} />
                            <a href={`tel:${nearestBranch.phone}`} className="text-xs text-gray-900 font-semibold hover:underline transition-colors">
                              {nearestBranch.phone}
                            </a>
                          </div>
                        )}
                        
                        {nearestBranch.workingHours && (
                          <div className="flex items-center space-x-2">
                            <Clock size={12} className="text-gray-900" strokeWidth={2} />
                            <p className="text-xs text-gray-700">{nearestBranch.workingHours}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {nearestBranch.mapLink && (
                          <a
                            href={nearestBranch.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors text-center"
                            style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}
                          >
                            Yol Tarifi
                          </a>
                        )}
                        <Link href="/iletisim" className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-300 py-2 px-3 rounded-lg text-xs font-semibold transition-colors text-center text-gray-900">
                          Tüm Şubeler
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <Link href="/iletisim" className="block w-full text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors text-center" style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}>
                    Bize Ulaşın
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* NOMANOĞLU Ailesi Section */}
        </div>
        
        <div className="fullscreen-hide" style={{backgroundColor: '#fffaeb', borderTop: '2px solid #f7de00', borderBottom: '2px solid #f7de00'}}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Hakkımızda */}
            <div className="overflow-hidden">
              <div className="p-8 md:p-12">
                {/* Başlık */}
                <div className="text-center mb-10">
                  <h3 className="text-3xl md:text-4xl font-bold mb-3">
                    <span className="text-gray-900">NOMANOĞLU </span>
                    <span style={{color: '#f7de00', WebkitTextStroke: '1px #1f2937'}}>ailesi.</span>
                  </h3>
                  <p className="text-gray-600 text-base">Yarım asrı aşkın tecrübesiyle, altına dair her şey.</p>
                </div>

                {/* Kartlar - Yan Yana Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {familyCards.length > 0 ? (
                    familyCards.map((card) => (
                      <div key={card.id} className="bg-white hover:bg-white rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg group" style={{border: '2px solid #f7de00'}}>
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{card.label}</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                            {getIconForFamily(card.icon, 16)}
                          </div>
                        </div>
                        <p className="text-gray-900 font-bold text-lg leading-snug mb-2">
                          {card.title}
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* Default kartlar - Backend'den veri gelene kadar */}
                      <div className="bg-white hover:bg-white rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg group" style={{border: '2px solid #f7de00'}}>
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">1967'den Beri</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                            <TrendingUp size={16} className="text-gray-900" strokeWidth={2} />
                          </div>
                        </div>
                        <p className="text-gray-900 font-bold text-lg leading-snug mb-2">
                          Yarım asırlık deneyim.
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          1967'den bugüne güvenilir ve kaliteli hizmet.
                        </p>
                      </div>

                      <div className="bg-white hover:bg-white rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg group" style={{border: '2px solid #f7de00'}}>
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Geniş Ağ</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                            <CheckCircle size={16} className="text-gray-900" strokeWidth={2} />
                          </div>
                        </div>
                        <p className="text-gray-900 font-bold text-lg leading-snug mb-2">
                          19 mağaza, 6 üretim.
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Adana, Mersin, Osmaniye, Kahramanmaraş ve İstanbul'da.
                        </p>
                      </div>

                      <div className="bg-white hover:bg-white rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg group" style={{border: '2px solid #f7de00'}}>
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Global Pazar</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                            <Star size={16} className="text-gray-900" strokeWidth={2} />
                          </div>
                        </div>
                        <p className="text-gray-900 font-bold text-lg leading-snug mb-2">
                          Uluslararası ihracat.
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Birçok ülkeye kaliteli ürün ihracatı.
                        </p>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bilgi & Rehber Makaleleri */}
        <div className="bg-white fullscreen-hide">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-3">
                <span className="text-gray-900">Bilgi & Rehber </span>
                <span style={{color: '#f7de00', WebkitTextStroke: '1px #1f2937'}}>Makaleleri</span>
              </h3>
              <p className="text-gray-600 text-base">Altın ve kıymetli madenler hakkında bilmeniz gereken her şey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {articles.length > 0 ? (
                articles.map((article) => (
                  <Link key={article.id} href={`/articles/${article.id}`}>
                    <div className="bg-gray-50 hover:bg-white rounded-xl p-6 transition-all cursor-pointer border-2 border-gray-200 hover:shadow-md group" style={{borderColor: article.id ? '#f7de00' : '#e5e7eb'}}>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">{article.category}</span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                          {getIconForArticle(article.icon, 20)}
                        </div>
                      </div>
                      <h4 className="text-gray-900 font-bold text-base mb-3 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {article.description}
                      </p>
                      <div className="flex items-center text-gray-900 text-sm font-semibold">
                        <span>Devamını Oku</span>
                        <TrendingUp size={14} className="ml-2 group-hover:ml-3 transition-all" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <>
                  {/* Default makaleler - Backend'den veri gelene kadar */}
                  <Link href="/articles/1">
                    <div className="bg-gray-50 hover:bg-white rounded-xl p-6 transition-all cursor-pointer border-2 hover:shadow-md group" style={{borderColor: '#f7de00'}}>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Yatırım</span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                          <Coins size={20} className="text-gray-900" strokeWidth={2} />
                        </div>
                      </div>
                      <h4 className="text-gray-900 font-bold text-base mb-3 leading-snug">
                        Altın Yatırımı Rehberi
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        Altın yatırımı yaparken dikkat edilmesi gereken önemli noktalar.
                      </p>
                      <div className="flex items-center text-gray-900 text-sm font-semibold">
                        <span>Devamını Oku</span>
                        <TrendingUp size={14} className="ml-2 group-hover:ml-3 transition-all" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>

                  <Link href="/articles/2">
                    <div className="bg-gray-50 hover:bg-white rounded-xl p-6 transition-all cursor-pointer border-2 hover:shadow-md group" style={{borderColor: '#f7de00'}}>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Karşılaştırma</span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                          <Gem size={20} className="text-gray-900" strokeWidth={2} />
                        </div>
                      </div>
                      <h4 className="text-gray-900 font-bold text-base mb-3 leading-snug">
                        Külçe mi Ziynet mi?
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        Külçe altın ile ziynet altını arasındaki farklar nelerdir?
                      </p>
                      <div className="flex items-center text-gray-900 text-sm font-semibold">
                        <span>Devamını Oku</span>
                        <TrendingUp size={14} className="ml-2 group-hover:ml-3 transition-all" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>

                  <Link href="/articles/3">
                    <div className="bg-gray-50 hover:bg-white rounded-xl p-6 transition-all cursor-pointer border-2 hover:shadow-md group" style={{borderColor: '#f7de00'}}>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Piyasa</span>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#f7de00'}}>
                          <TrendingUp size={20} className="text-gray-900" strokeWidth={2} />
                        </div>
                      </div>
                      <h4 className="text-gray-900 font-bold text-base mb-3 leading-snug">
                        Döviz Kurları Nasıl Belirlenir?
                      </h4>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        Döviz kurlarını etkileyen faktörler ve piyasa dinamikleri.
                      </p>
                      <div className="flex items-center text-gray-900 text-sm font-semibold">
                        <span>Devamını Oku</span>
                        <TrendingUp size={14} className="ml-2 group-hover:ml-3 transition-all" strokeWidth={2.5} />
                      </div>
                    </div>
                  </Link>
                </>
              )}
            </div>

            {/* Tüm Makaleleri Gör Butonu */}
            <div className="text-center mt-10">
              <button className="inline-flex items-center space-x-2 px-8 py-3 font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md" style={{backgroundColor: '#f7de00', color: '#1f2937', border: '2px solid #1f2937'}}>
                <span>Tüm Makaleleri Görüntüle</span>
                <TrendingUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="max-w-7xl mx-auto px-6 py-8 fullscreen-hide">
          <div className="rounded-xl p-6 shadow-sm border-2" style={{backgroundColor: '#fffaeb', borderColor: '#f7de00'}}>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#f7de00'}}>
                <AlertCircle size={24} className="text-gray-900" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-bold text-gray-900 mb-1">Önemli Bilgilendirme</h5>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Burada yer alan fiyatlar bilgi amaçlıdır ve yatırım danışmanlığı kapsamında değildir. 
                  Fiyatlar gerçek zamanlı olarak güncellenmekte olup, işlem yapmadan önce şubelerimizle iletişime geçmenizi öneririz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="fullscreen-hide" style={{backgroundColor: '#f7de00', color: '#1f2937'}}>
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Logo & About */}
              <div className="md:col-span-1">
                {logoBase64 ? (
                  <img 
                    src={logoBase64} 
                    alt="NOMANOĞLU" 
                    className="mb-4 brightness-0 invert opacity-90" 
                    style={{ 
                      height: '40px', 
                      width: 'auto',
                      maxWidth: '200px'
                    }} 
                  />
                ) : (
                  <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'serif', letterSpacing: '0.5px'}}>
                    NOMANOĞLU
                  </h3>
                )}
                <p className="text-sm text-gray-800 leading-relaxed mb-4">
                  1967'den bu yana altın ve kuyumculuk sektöründe güvenilir hizmet anlayışı ile hizmetinizdeyiz.
                </p>
                <div className="flex items-center space-x-3">
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group">
                    <Facebook size={20} className="text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group">
                    <Twitter size={20} className="text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group">
                    <Instagram size={20} className="text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors group">
                    <Youtube size={20} className="text-white" strokeWidth={2} />
                  </a>
                </div>
              </div>

              {/* Hızlı Linkler */}
              <div>
                <h4 className="text-gray-900 font-bold mb-4 text-sm uppercase tracking-wider">Hızlı Linkler</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      Anasayfa
                    </Link>
                  </li>
                  <li>
                    <Link href="/piyasalar" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      Piyasalar
                    </Link>
                  </li>
                  <li>
                    <Link href="/alarms" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      Fiyat Alarmları
                    </Link>
                  </li>
                  <li>
                    <Link href="/iletisim" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      İletişim & Şubeler
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Mobil Uygulama */}
              <div>
                <h4 className="text-gray-900 font-bold mb-4 text-sm uppercase tracking-wider">Mobil Uygulama</h4>
                <div className="bg-white rounded-xl p-4 inline-block">
                  {/* QR Code Placeholder */}
                  <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                    <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* QR Code Pattern */}
                      <rect width="128" height="128" fill="white"/>
                      {/* Top-left corner */}
                      <rect x="8" y="8" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                      <rect x="16" y="16" width="24" height="24" fill="black"/>
                      {/* Top-right corner */}
                      <rect x="80" y="8" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                      <rect x="88" y="16" width="24" height="24" fill="black"/>
                      {/* Bottom-left corner */}
                      <rect x="8" y="80" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                      <rect x="16" y="88" width="24" height="24" fill="black"/>
                      {/* Data pattern */}
                      <rect x="56" y="8" width="8" height="8" fill="black"/>
                      <rect x="56" y="24" width="8" height="8" fill="black"/>
                      <rect x="56" y="40" width="8" height="8" fill="black"/>
                      <rect x="8" y="56" width="8" height="8" fill="black"/>
                      <rect x="24" y="56" width="8" height="8" fill="black"/>
                      <rect x="40" y="56" width="8" height="8" fill="black"/>
                      <rect x="56" y="56" width="8" height="8" fill="black"/>
                      <rect x="72" y="56" width="8" height="8" fill="black"/>
                      <rect x="88" y="56" width="8" height="8" fill="black"/>
                      <rect x="104" y="56" width="8" height="8" fill="black"/>
                      <rect x="112" y="56" width="8" height="8" fill="black"/>
                      <rect x="56" y="72" width="8" height="8" fill="black"/>
                      <rect x="72" y="72" width="8" height="8" fill="black"/>
                      <rect x="88" y="72" width="8" height="8" fill="black"/>
                      <rect x="104" y="72" width="8" height="8" fill="black"/>
                      <rect x="56" y="88" width="8" height="8" fill="black"/>
                      <rect x="72" y="88" width="8" height="8" fill="black"/>
                      <rect x="104" y="88" width="8" height="8" fill="black"/>
                      <rect x="56" y="104" width="8" height="8" fill="black"/>
                      <rect x="88" y="104" width="8" height="8" fill="black"/>
                      <rect x="104" y="104" width="8" height="8" fill="black"/>
                      <rect x="56" y="120" width="8" height="8" fill="black"/>
                      <rect x="72" y="120" width="8" height="8" fill="black"/>
                      <rect x="88" y="120" width="8" height="8" fill="black"/>
                      <rect x="120" y="72" width="8" height="8" fill="black"/>
                      <rect x="120" y="88" width="8" height="8" fill="black"/>
                      <rect x="120" y="104" width="8" height="8" fill="black"/>
                      <rect x="120" y="120" width="8" height="8" fill="black"/>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-800 mt-3 leading-relaxed">
                  Mobil uygulamamızı indirmek için QR kodu tarayın
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <a href="#" className="inline-block">
                    <div className="bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <div className="text-left">
                          <p className="text-[8px] text-gray-400 leading-none">Download on</p>
                          <p className="text-xs text-white font-semibold leading-tight">App Store</p>
                        </div>
                      </div>
                    </div>
                  </a>
                  <a href="#" className="inline-block">
                    <div className="bg-gray-900 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm10.84-8.5l2.64-2.64 4.37 2.52c.5.29.5 1.05 0 1.34l-4.37 2.52L13.84 12zM3.85 3.65L13.69 12 3.85 20.35V3.65z"/>
                        </svg>
                        <div className="text-left">
                          <p className="text-[8px] text-gray-400 leading-none">GET IT ON</p>
                          <p className="text-xs text-white font-semibold leading-tight">Google Play</p>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* İletişim */}
              <div>
                <h4 className="text-gray-900 font-bold mb-4 text-sm uppercase tracking-wider">İletişim</h4>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <MapPin size={18} className="text-gray-900 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-gray-800">Kadirli, Osmaniye</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Phone size={18} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                    <a href="tel:+905322904601" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      0532 290 46 01
                    </a>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Mail size={18} className="text-gray-900 flex-shrink-0" strokeWidth={2} />
                    <a href="mailto:info@nomanoglu.com" className="text-sm text-gray-800 hover:text-gray-900 hover:underline transition-colors">
                      info@nomanoglu.com
                    </a>
                  </li>
                </ul>

                {/* WhatsApp Destek */}
                <div className="mt-4">
                  <a
                    href="https://wa.me/905322904601"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all group"
                  >
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-sm font-semibold">WhatsApp Destek</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        </footer>
      </div>
    </>
  );
}
