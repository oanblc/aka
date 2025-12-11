import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { Search, TrendingUp, TrendingDown, DollarSign, Euro, Coins, Gem, Star, Maximize2, Bell, AlertCircle, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Piyasalar() {
  const { prices, isConnected } = useWebSocket();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // LocalStorage'dan favorileri yükle
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
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
    const interval = setInterval(loadAlarmCount, 5000);
    
    // Logo'yu yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')+'/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogoBase64(data.data.logoBase64 || '');
          setLogoHeight(data.data.logoHeight || 48);
          setLogoWidth(data.data.logoWidth || 'auto');
        }
      })
      .catch(err => console.error('Logo yükleme hatası:', err));

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

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const filteredPrices = prices
    .filter(p => {
      if (showOnlyFavorites && !favorites.includes(p.code)) return false;
      if (filter !== 'all' && p.category !== filter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getIcon = (code) => {
    if (code.includes('USD')) return <DollarSign size={18} strokeWidth={2} />;
    if (code.includes('EUR')) return <Euro size={18} strokeWidth={2} />;
    if (code.includes('ALTIN') || code.includes('GOLD') || code.includes('ONS')) return <Coins size={18} strokeWidth={2} />;
    if (code.includes('GUMUS') || code.includes('SILVER')) return <Gem size={18} strokeWidth={2} />;
    return <DollarSign size={18} strokeWidth={2} />;
  };

  return (
    <>
      <Head>
        <title>Piyasalar - Canlı Döviz ve Altın Fiyatları</title>
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
        <nav className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95">
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
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-md opacity-30"></div>
                      <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative">
                        <circle cx="20" cy="20" r="18" fill="url(#gold-gradient-nav)" stroke="#d97706" strokeWidth="2"/>
                        <circle cx="20" cy="20" r="12" fill="none" stroke="#d97706" strokeWidth="1.5"/>
                        <defs>
                          <linearGradient id="gold-gradient-nav" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fbbf24"/>
                            <stop offset="50%" stopColor="#f59e0b"/>
                            <stop offset="100%" stopColor="#d97706"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent" style={{fontFamily: 'serif', letterSpacing: '0.5px'}}>NOMANOĞLU</h1>
                      <p className="text-xs text-amber-600 font-semibold tracking-wider">Kuyumculuk</p>
                    </div>
                  </>
                )}
              </Link>

              {/* Nav Links - Center */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/" className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50/50 rounded-t-lg transition-all">
                  Anasayfa
                </Link>
                <Link href="/piyasalar" className="px-5 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 border-b-2 border-amber-600 rounded-t-lg transition-all">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50/50 rounded-t-lg transition-all">
                  <span>Alarmlar</span>
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg ring-2 ring-white">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50/50 rounded-t-lg transition-all">
                  İletişim
                </Link>
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                <a
                  href="https://wa.me/905322904601"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-700 hover:text-amber-800 rounded-lg transition-all group"
                >
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-sm font-semibold hidden sm:inline">WhatsApp Destek</span>
                  <span className="text-sm font-semibold sm:hidden">Destek</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile App Download Banner */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Text & Buttons */}
              <div className="flex items-center space-x-6">
                <div className="hidden md:block">
                  <h3 className="text-white font-bold text-lg mb-1">Mobil Uygulamamızı İndirin</h3>
                  <p className="text-gray-400 text-sm">Fiyatları anında takip edin, alarm kurun ve daha fazlası!</p>
                </div>
                <div className="flex items-center space-x-2">
                  <a href="#" className="inline-block group">
                    <div className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-amber-500">
                      <div className="flex items-center space-x-2">
                        <svg className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <div className="text-left">
                          <p className="text-[9px] text-gray-400 leading-none">Download on</p>
                          <p className="text-sm text-white font-semibold leading-tight">App Store</p>
                        </div>
                      </div>
                    </div>
                  </a>
                  <a href="#" className="inline-block group">
                    <div className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-all border border-gray-700 hover:border-amber-500">
                      <div className="flex items-center space-x-2">
                        <svg className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm10.84-8.5l2.64-2.64 4.37 2.52c.5.29.5 1.05 0 1.34l-4.37 2.52L13.84 12zM3.85 3.65L13.69 12 3.85 20.35V3.65z"/>
                        </svg>
                        <div className="text-left">
                          <p className="text-[9px] text-gray-400 leading-none">GET IT ON</p>
                          <p className="text-sm text-white font-semibold leading-tight">Google Play</p>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
                <div className="md:hidden">
                  <p className="text-white font-semibold text-sm">Mobil Uygulamamızı İndirin</p>
                </div>
              </div>

              {/* Right: QR Code */}
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-semibold text-sm mb-1">QR Kodu Tarayın</p>
                  <p className="text-gray-400 text-xs">Hemen indirin</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <svg width="64" height="64" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="128" height="128" fill="white"/>
                    <rect x="8" y="8" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                    <rect x="16" y="16" width="24" height="24" fill="black"/>
                    <rect x="80" y="8" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                    <rect x="88" y="16" width="24" height="24" fill="black"/>
                    <rect x="8" y="80" width="40" height="40" stroke="black" strokeWidth="3" fill="none"/>
                    <rect x="16" y="88" width="24" height="24" fill="black"/>
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
            </div>
          </div>
        </div>

        {/* Main Content - Full Width Price Table */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div id="price-table-container">
            <div className="price-table-content">
              {/* Page Title */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Canlı Piyasa Fiyatları</h1>
                <p className="text-gray-600">Gerçek zamanlı döviz ve altın fiyatlarını takip edin</p>
              </div>

              {/* Favorilerim Başlık */}
              {showOnlyFavorites && (
                <div className="mb-6">
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
              <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setFilter('all'); setShowOnlyFavorites(false); }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        filter === 'all' && !showOnlyFavorites
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tümü
                    </button>
                    <button
                      onClick={() => { setFilter('altin'); setShowOnlyFavorites(false); }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        filter === 'altin' && !showOnlyFavorites
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Altın
                    </button>
                    <button
                      onClick={() => { setFilter('doviz'); setShowOnlyFavorites(false); }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        filter === 'doviz' && !showOnlyFavorites
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Döviz
                    </button>
                    <button
                      onClick={() => { setFilter('gumus'); setShowOnlyFavorites(false); }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        filter === 'gumus' && !showOnlyFavorites
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Gümüş
                    </button>
                    <button
                      onClick={() => { setShowOnlyFavorites(true); setFilter('all'); }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                        showOnlyFavorites
                          ? 'bg-gray-800 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Star size={14} strokeWidth={2} className={favorites.length > 0 && showOnlyFavorites ? 'fill-white text-white' : favorites.length > 0 ? 'fill-amber-500 text-amber-500' : ''} />
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
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-0 rounded text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Price Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                  <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-4">Ürün Adı</div>
                    <div className="col-span-2 text-right">Alış Fiyatı</div>
                    <div className="col-span-3 text-right">Satış Fiyatı</div>
                    <div className="col-span-2 text-right">Değişim</div>
                    <div className="col-span-1"></div>
                  </div>
                </div>

                {/* Table Body */}
                {prices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="text-gray-500 mt-3 text-sm">Fiyatlar yükleniyor...</p>
                  </div>
                ) : filteredPrices.length === 0 ? (
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
                        className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Tüm Fiyatlara Dön
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[calc(100vh-300px)] overflow-y-auto price-table-scroll">
                    {filteredPrices.map((price) => {
                      const currentTime = new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});
                      const isFavorite = favorites.includes(price.code);

                      return (
                        <div 
                          key={price.code} 
                          className="px-6 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 group"
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Birim + Saat */}
                            <div className="col-span-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {/* Favori Butonu */}
                                  <button
                                    onClick={() => toggleFavorite(price.code)}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
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

                                  <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                                    {getIcon(price.code)}
                                  </div>
                                  <div>
                                    <p className="text-gray-900 font-semibold text-sm">{price.code}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{price.name}</p>
                                  </div>
                                </div>
                                
                                {/* Saat Bilgisi */}
                                <div className="text-gray-400 text-xs font-medium">
                                  {currentTime}
                                </div>
                              </div>
                            </div>

                            {/* Alış */}
                            <div className="col-span-2 text-right">
                              <p className="text-gray-900 font-semibold text-base tabular-nums">
                                ₺{formatPrice(price.calculatedAlis)}
                              </p>
                            </div>

                            {/* Satış */}
                            <div className="col-span-3 text-right">
                              <p className="text-gray-900 font-bold text-base tabular-nums">
                                ₺{formatPrice(price.calculatedSatis)}
                              </p>
                            </div>

                            {/* Değişim */}
                            <div className="col-span-2 text-right">
                              {price.direction && (price.direction.alis === 'up' || price.direction.satis === 'up') ? (
                                <div className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-green-50">
                                  <TrendingUp size={16} strokeWidth={2.5} className="text-green-600" />
                                  <span className="text-xs font-semibold text-green-700">Yükseliş</span>
                                </div>
                              ) : price.direction && (price.direction.alis === 'down' || price.direction.satis === 'down') ? (
                                <div className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-red-50">
                                  <TrendingDown size={16} strokeWidth={2.5} className="text-red-600" />
                                  <span className="text-xs font-semibold text-red-700">Düşüş</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-50">
                                  <span className="text-xs font-medium text-gray-500">—</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Table Footer */}
                {filteredPrices.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 text-center">
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
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-md transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
        </div>

        {/* Disclaimer Section */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-amber-600" strokeWidth={2} />
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
        <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Logo & About */}
              <div className="md:col-span-1">
                <h3 className="text-2xl font-bold text-white mb-4" style={{fontFamily: 'serif', letterSpacing: '0.5px'}}>
                  NOMANOĞLU
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  1967'den bu yana altın ve kuyumculuk sektöründe güvenilir hizmet anlayışı ile hizmetinizdeyiz.
                </p>
                <div className="flex items-center space-x-3">
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-amber-600 flex items-center justify-center transition-colors group">
                    <Facebook size={20} className="text-gray-400 group-hover:text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-amber-600 flex items-center justify-center transition-colors group">
                    <Twitter size={20} className="text-gray-400 group-hover:text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-amber-600 flex items-center justify-center transition-colors group">
                    <Instagram size={20} className="text-gray-400 group-hover:text-white" strokeWidth={2} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-amber-600 flex items-center justify-center transition-colors group">
                    <Youtube size={20} className="text-gray-400 group-hover:text-white" strokeWidth={2} />
                  </a>
                </div>
              </div>

              {/* Hızlı Linkler */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Hızlı Linkler</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-sm hover:text-amber-400 transition-colors">
                      Anasayfa
                    </Link>
                  </li>
                  <li>
                    <Link href="/piyasalar" className="text-sm hover:text-amber-400 transition-colors">
                      Piyasalar
                    </Link>
                  </li>
                  <li>
                    <Link href="/alarms" className="text-sm hover:text-amber-400 transition-colors">
                      Fiyat Alarmları
                    </Link>
                  </li>
                  <li>
                    <Link href="/iletisim" className="text-sm hover:text-amber-400 transition-colors">
                      İletişim & Şubeler
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Mobil Uygulama */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Mobil Uygulama</h4>
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
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  Mobil uygulamamızı indirmek için QR kodu tarayın
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <a href="#" className="inline-block">
                    <div className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
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
                    <div className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
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
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">İletişim</h4>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm">Kadirli, Osmaniye</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Phone size={18} className="text-amber-500 flex-shrink-0" strokeWidth={2} />
                    <a href="tel:+905322904601" className="text-sm hover:text-amber-400 transition-colors">
                      0532 290 46 01
                    </a>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Mail size={18} className="text-amber-500 flex-shrink-0" strokeWidth={2} />
                    <a href="mailto:info@nomanoglu.com" className="text-sm hover:text-amber-400 transition-colors">
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
                    className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all group"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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

