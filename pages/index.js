import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Search, TrendingUp, TrendingDown, Star, Maximize2, Phone, Mail, Clock, ChevronRight, X, Bell, ArrowRight } from 'lucide-react';

export default function Home() {
  const { prices: websocketPrices, isConnected, lastUpdate: wsLastUpdate } = useWebSocket();
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64, isLoaded: logoLoaded,
    contactPhone, contactEmail, contactAddress, workingHours, workingHoursNote,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialTiktok, socialWhatsapp
  } = useSettings();
  const [prices, setPrices] = useState([]);
  const previousPricesRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [priceChanges, setPriceChanges] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // WebSocket'ten gelen fiyatları güncelle
  useEffect(() => {
    if (!websocketPrices || !Array.isArray(websocketPrices) || websocketPrices.length === 0) {
      if (previousPricesRef.current.length > 0 && prices.length === 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    const customPrices = websocketPrices.filter(p => p.isCustom === true);

    if (customPrices.length === 0) {
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    // Fiyat değişikliklerini kontrol et
    const newChanges = {};
    customPrices.forEach(newPrice => {
      const oldPrice = previousPricesRef.current.find(p => p.code === newPrice.code);
      if (oldPrice) {
        if (newPrice.calculatedAlis > oldPrice.calculatedAlis || newPrice.calculatedSatis > oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'up';
        } else if (newPrice.calculatedAlis < oldPrice.calculatedAlis || newPrice.calculatedSatis < oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'down';
        }
      }
    });

    if (Object.keys(newChanges).length > 0) {
      setPriceChanges(prev => ({ ...prev, ...newChanges }));
      // 3 saniye sonra değişim durumunu temizle
      setTimeout(() => {
        setPriceChanges(prev => {
          const updated = { ...prev };
          Object.keys(newChanges).forEach(key => delete updated[key]);
          return updated;
        });
      }, 3000);
    }

    setPrices(customPrices);
    previousPricesRef.current = customPrices;
    setLastUpdate(new Date());
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

    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/branches')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setBranches(data.data);
        }
      })
      .catch(err => console.error('Şube yükleme hatası:', err));

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

  const filteredPrices = prices
    .filter(p => {
      if (showOnlyFavorites && !favorites.includes(p.code)) return false;
      if (filter !== 'all' && p.category !== filter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <Head>
        <title>AKA Kuyumculuk - Canlı Altın ve Döviz Fiyatları</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="Anlık altın ve döviz fiyatlarını takip edin. Güvenilir, hızlı ve güncel piyasa verileri." />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Header - Midas Style */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-sm font-medium text-blue-600">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Alarmlar
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-2 -right-4 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-500">
                    {isConnected ? (timeSinceUpdate || 'Canlı') : 'Bağlanıyor...'}
                  </span>
                </div>

                {/* WhatsApp */}
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <span>İletişim</span>
                    <ArrowRight size={16} />
                  </a>
                )}

                {/* Mobile Menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-100">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarmsCount > 0 && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Canlı Fiyatlar</h1>
            <p className="text-gray-500">Anlık altın ve döviz kurları</p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => { setShowOnlyFavorites(false); setFilter('all'); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  !showOnlyFavorites && filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => { setShowOnlyFavorites(true); setFilter('all'); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  showOnlyFavorites
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Star size={14} className={favorites.length > 0 ? 'fill-current' : ''} />
                <span>Favoriler</span>
                {favorites.length > 0 && (
                  <span className={`text-xs ${showOnlyFavorites ? 'text-blue-200' : 'text-gray-400'}`}>
                    ({favorites.length})
                  </span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Price Table */}
          <div id="price-table-container" className="mb-8">
            {prices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Fiyatlar yükleniyor...</p>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl">
                <Star size={40} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-4">
                  {showOnlyFavorites ? 'Henüz favori eklemediniz' : 'Sonuç bulunamadı'}
                </p>
                <button
                  onClick={() => { setShowOnlyFavorites(false); setSearch(''); }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
                >
                  Tüm Fiyatlara Dön
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-5 sm:col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ürün</div>
                  <div className="col-span-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Alış</div>
                  <div className="col-span-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Satış</div>
                  <div className="col-span-1 sm:col-span-2"></div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {filteredPrices.map((price) => {
                    const isFavorite = favorites.includes(price.code);
                    const change = priceChanges[price.code];
                    const isUp = change === 'up';
                    const isDown = change === 'down';

                    return (
                      <div
                        key={price.code}
                        className={`grid grid-cols-12 gap-2 px-4 sm:px-6 py-4 items-center transition-colors hover:bg-gray-50 ${
                          isUp ? 'bg-green-50' : isDown ? 'bg-red-50' : ''
                        }`}
                      >
                        {/* Product */}
                        <div className="col-span-5 sm:col-span-4">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{price.name}</p>
                              <p className="text-xs text-gray-400">{price.code}</p>
                            </div>
                          </div>
                        </div>

                        {/* Buy Price */}
                        <div className="col-span-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {isUp && <TrendingUp size={14} className="text-green-600" />}
                            {isDown && <TrendingDown size={14} className="text-red-600" />}
                            <span className={`text-sm font-semibold tabular-nums ${
                              isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatPrice(price.calculatedAlis)}
                            </span>
                          </div>
                        </div>

                        {/* Sell Price */}
                        <div className="col-span-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {isUp && <TrendingUp size={14} className="text-green-600" />}
                            {isDown && <TrendingDown size={14} className="text-red-600" />}
                            <span className={`text-sm font-semibold tabular-nums ${
                              isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatPrice(price.calculatedSatis)}
                            </span>
                          </div>
                        </div>

                        {/* Favorite */}
                        <div className="col-span-1 sm:col-span-2 flex justify-end">
                          <button
                            onClick={() => toggleFavorite(price.code)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Star
                              size={18}
                              className={`transition-colors ${
                                isFavorite
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-gray-400'
                              }`}
                            />
                          </button>
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
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Maximize2 size={16} />
                  <span>Tam Ekran</span>
                </button>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Contact */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">İletişim</h3>
              <div className="space-y-3">
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="flex items-center space-x-3 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone size={16} />
                    <span>{contactPhone}</span>
                  </a>
                )}
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center space-x-3 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail size={16} />
                    <span>{contactEmail}</span>
                  </a>
                )}
                {workingHours && (
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{workingHours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Branches */}
            {branches.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Şubelerimiz</h3>
                  {branches.length > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentBranchIndex(prev => prev === 0 ? branches.length - 1 : prev - 1)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight size={16} className="text-gray-400 rotate-180" />
                      </button>
                      <span className="text-xs text-gray-400">{currentBranchIndex + 1}/{branches.length}</span>
                      <button
                        onClick={() => setCurrentBranchIndex(prev => prev === branches.length - 1 ? 0 : prev + 1)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <ChevronRight size={16} className="text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{branches[currentBranchIndex]?.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{branches[currentBranchIndex]?.address}</p>
                  {branches[currentBranchIndex]?.mapLink && (
                    <a
                      href={branches[currentBranchIndex].mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <span>Yol Tarifi</span>
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Alarm CTA */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Fiyat Alarmı</h3>
                  <p className="text-sm text-gray-600 mb-3">Hedef fiyatlarınıza ulaşıldığında anında bildirim alın.</p>
                  <Link
                    href="/alarms"
                    className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <span>Alarm Oluştur</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">
              Fiyatlar bilgi amaçlıdır. İşlem yapmadan önce şubelerimizle iletişime geçiniz.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="AKA Kuyumculuk"
                    className="h-8 object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-900">AKA Kuyumculuk</span>
                )}
              </div>

              <nav className="flex items-center space-x-6">
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Fiyatlar</Link>
                <Link href="/piyasalar" className="text-sm text-gray-500 hover:text-gray-900">Piyasalar</Link>
                <Link href="/alarms" className="text-sm text-gray-500 hover:text-gray-900">Alarmlar</Link>
                <Link href="/iletisim" className="text-sm text-gray-500 hover:text-gray-900">İletişim</Link>
              </nav>

              <p className="text-xs text-gray-400">
                © 2024 AKA Kuyumculuk
              </p>
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
      `}</style>
    </>
  );
}
