import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Search, TrendingUp, TrendingDown, Star, Maximize2, X, ArrowRight, LayoutGrid } from 'lucide-react';

export default function Piyasalar() {
  const { prices: websocketPrices, isConnected } = useWebSocket();
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64, isLoaded: logoLoaded,
    contactPhone, contactEmail, socialWhatsapp
  } = useSettings();
  const [prices, setPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [priceChanges, setPriceChanges] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const previousPricesRef = useRef([]);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  // WebSocket'ten gelen fiyatları güncelle - önceki fiyatları koru
  useEffect(() => {
    if (!websocketPrices || !Array.isArray(websocketPrices) || websocketPrices.length === 0) {
      // Eğer websocket'ten veri gelmezse, önceki fiyatları koru
      if (previousPricesRef.current.length > 0 && prices.length === 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    // Custom fiyatları filtrele
    const customPrices = websocketPrices.filter(p => p.isCustom === true);

    if (customPrices.length > 0) {
      setPrices(customPrices);
      previousPricesRef.current = customPrices;
    }
  }, [websocketPrices]);

  // Fiyat değişikliklerini takip et
  useEffect(() => {
    if (prices.length === 0) return;

    const newChanges = {};
    const newHistory = { ...priceHistory };

    prices.forEach(newPrice => {
      const oldPrice = previousPricesRef.current.find(p => p.code === newPrice.code);

      // Fiyat geçmişi kaydet
      if (!newHistory[newPrice.code]) {
        newHistory[newPrice.code] = {
          prices: [],
          openPrice: newPrice.calculatedSatis,
          lastPrice: newPrice.calculatedSatis
        };
      }

      const history = newHistory[newPrice.code];
      history.prices.push(newPrice.calculatedSatis);
      if (history.prices.length > 24) {
        history.prices.shift();
      }
      history.lastPrice = newPrice.calculatedSatis;

      if (oldPrice) {
        if (newPrice.calculatedAlis > oldPrice.calculatedAlis || newPrice.calculatedSatis > oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'up';
        } else if (newPrice.calculatedAlis < oldPrice.calculatedAlis || newPrice.calculatedSatis < oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'down';
        }
      }
    });

    setPriceHistory(newHistory);
    setLastUpdate(new Date());

    if (Object.keys(newChanges).length > 0) {
      setPriceChanges(prev => ({ ...prev, ...newChanges }));
      setTimeout(() => {
        setPriceChanges(prev => {
          const updated = { ...prev };
          Object.keys(newChanges).forEach(key => delete updated[key]);
          return updated;
        });
      }, 3000);
    }
  }, [prices]);

  // Son güncelleme zamanı
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

      if (diffSec < 5) {
        setTimeSinceUpdate('Şimdi');
      } else if (diffSec < 60) {
        setTimeSinceUpdate(`${diffSec}s önce`);
      } else {
        setTimeSinceUpdate(`${diffMin}dk önce`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    setMounted(true);
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

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

    return () => clearInterval(interval);
  }, []);

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
      maximumFractionDigits: 2
    }).format(price);
  };

  // Spread yüzdesini hesapla (Satış - Alış) / Alış * 100
  const calculateSpread = (price) => {
    if (!price || !price.calculatedAlis || !price.calculatedSatis) return null;
    if (price.calculatedAlis === 0) return null;

    const spread = ((price.calculatedSatis - price.calculatedAlis) / price.calculatedAlis) * 100;
    return spread;
  };

  const filteredPrices = prices
    .filter(p => {
      if (showOnlyFavorites && !favorites.includes(p.code)) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Mini Sparkline komponenti
  const MiniSparkline = ({ data, isUp }) => {
    if (!data || data.length < 2) return null;

    const width = 50;
    const height = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const color = isUp ? '#10B981' : '#EF4444';

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <>
      <Head>
        <title>Piyasalar - Canlı Döviz ve Altın Fiyatları</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="AKA Kuyumculuk"
                    className="object-contain"
                    style={{
                      height: `${Math.min(logoHeight, 40)}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-900">AKA Kuyumculuk</span>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Alarmlar
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {/* Connection Status */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-xs font-medium text-gray-600">
                    {isConnected ? (timeSinceUpdate || 'Canlı') : 'Bağlanıyor...'}
                  </span>
                </div>

                {/* WhatsApp */}
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg"
                  >
                    <span>İletişim</span>
                    <ArrowRight size={16} />
                  </a>
                )}

                {/* Mobile Menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-100">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarmsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarmsCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                    İletişim
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Page Header - Modern Tek Satır */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h1 className="text-2xl font-bold text-gray-900">Piyasalar</h1>
            </div>
            <div className="hidden sm:block h-5 w-px bg-gray-200"></div>
            <p className="hidden sm:block text-sm text-gray-400 font-medium">Gerçek zamanlı döviz ve altın fiyatları</p>
          </div>

          {/* Filter Bar - Tümü, Favoriler ve Arama */}
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-2">
            <div className="flex items-center justify-between gap-4">
              {/* Sol: Tümü ve Favoriler */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => { setShowOnlyFavorites(false); }}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    !showOnlyFavorites
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span>Tümü</span>
                </button>
                <button
                  onClick={() => { setShowOnlyFavorites(true); }}
                  className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    showOnlyFavorites
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Star size={16} className={showOnlyFavorites || favorites.length > 0 ? 'fill-current' : ''} />
                  <span>Favoriler</span>
                  {favorites.length > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      showOnlyFavorites ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {favorites.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Sağ: Arama */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Price Table */}
          <div id="price-table-container" className="mb-8">
            {filteredPrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
                <Star size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-4">
                  {showOnlyFavorites ? 'Henüz favori eklemediniz' : 'Sonuç bulunamadı'}
                </p>
                <button
                  onClick={() => { setShowOnlyFavorites(false); setSearch(''); }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tüm Fiyatlara Dön
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Table Header - Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ürün</div>
                  <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Trend</div>
                  <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Alış</div>
                  <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Satış</div>
                  <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Değişim</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Mobile Header */}
                <div className="sm:hidden flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Ürün</span>
                  <span className="text-xs font-semibold text-gray-500 uppercase">Alış / Satış</span>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {filteredPrices.map((price) => {
                    const isFavorite = favorites.includes(price.code);
                    const change = priceChanges[price.code];
                    const isUp = change === 'up';
                    const isDown = change === 'down';
                    const spreadPercent = calculateSpread(price);
                    const history = priceHistory[price.code];
                    const trendUp = spreadPercent !== null ? true : null;

                    return (
                      <div
                        key={price.code}
                        className={`transition-all duration-300 cursor-pointer group ${isUp ? 'bg-green-50' : isDown ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                      >
                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 items-center">
                          {/* Product */}
                          <div className="col-span-3">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {price.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{price.code}</p>
                          </div>

                          {/* Mini Sparkline */}
                          <div className="col-span-2 flex justify-end items-center">
                            {history?.prices && <MiniSparkline data={history.prices} isUp={trendUp} />}
                          </div>

                          {/* Buy Price */}
                          <div className="col-span-2 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {isUp && <TrendingUp size={12} className="text-green-600" />}
                              {isDown && <TrendingDown size={12} className="text-red-600" />}
                              <span className={`text-sm font-semibold tabular-nums ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedAlis)}
                              </span>
                            </div>
                          </div>

                          {/* Sell Price */}
                          <div className="col-span-2 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {isUp && <TrendingUp size={12} className="text-green-600" />}
                              {isDown && <TrendingDown size={12} className="text-red-600" />}
                              <span className={`text-sm font-semibold tabular-nums ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedSatis)}
                              </span>
                            </div>
                          </div>

                          {/* Spread Percentage */}
                          <div className="col-span-2 text-right">
                            {spreadPercent !== null ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
                                %{spreadPercent.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>

                          {/* Favorite */}
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(price.code); }}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-all hover:scale-110"
                            >
                              <Star size={18} className={`transition-all ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 group-hover:text-gray-400'}`} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="sm:hidden flex items-center justify-between px-3 py-2.5 gap-2">
                          {/* Left: Favorite + Product Name (2 satır) */}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(price.code); }}
                              className="p-1.5 -ml-1 flex-shrink-0 active:scale-95 transition-transform"
                            >
                              <Star size={18} className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            </button>
                            <p className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-2">
                              {price.name}
                            </p>
                          </div>

                          {/* Right: Prices */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Change indicator */}
                            {(isUp || isDown) && (
                              <div className={`${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                            )}
                            {/* Prices */}
                            <div className="text-right min-w-[70px]">
                              <div className={`text-[11px] font-medium tabular-nums leading-tight ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-400'}`}>
                                {formatPrice(price.calculatedAlis)}
                              </div>
                              <div className={`text-[15px] font-bold tabular-nums leading-tight ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'}`}>
                                {formatPrice(price.calculatedSatis)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fullscreen Button */}
            {filteredPrices.length > 0 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    const container = document.getElementById('price-table-container');
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      container.requestFullscreen();
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
                >
                  <Maximize2 size={16} />
                  <span>Tam Ekran</span>
                </button>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500">
              Fiyatlar bilgi amaçlıdır. İşlem yapmadan önce şubelerimizle iletişime geçiniz.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Logo & Description */}
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-3">
                  {logoBase64 ? (
                    <img
                      src={logoBase64}
                      alt="AKA Kuyumculuk"
                      className="h-10 object-contain"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-900">AKA Kuyumculuk</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Güvenilir altın ve döviz fiyatları
                </p>
              </div>

              {/* Navigation Links */}
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Hızlı Erişim</h3>
                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                  <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Fiyatlar</Link>
                  <Link href="/piyasalar" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Piyasalar</Link>
                  <Link href="/alarms" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Alarmlar</Link>
                  <Link href="/iletisim" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">İletişim</Link>
                </nav>
              </div>

              {/* Mobile App Links */}
              <div className="text-center md:text-right">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Mobil Uygulama</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    Google Play
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-400">
                  © 2025 AKA Kuyumculuk. Tüm hakları saklıdır.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        #price-table-container:fullscreen {
          background: white;
          padding: 2rem;
          overflow-y: auto;
        }

        .group:hover {
          transform: translateX(2px);
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}
