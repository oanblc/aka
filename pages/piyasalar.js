import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Search, TrendingUp, TrendingDown, Star, Maximize2, AlertCircle, Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Youtube, Coins } from 'lucide-react';

export default function Piyasalar() {
  const { prices: websocketPrices, isConnected } = useWebSocket();
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64, isLoaded: logoLoaded,
    contactPhone, contactEmail, contactAddress, workingHours,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialWhatsapp
  } = useSettings();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom fiyatları filtrele (panelden oluşturulan fiyatlar)
  const prices = websocketPrices.filter(p => p.isCustom === true);

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

  return (
    <>
      <Head>
        <title>Piyasalar - Canlı Döviz ve Altın Fiyatları</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <style>{`
          #price-table-container:fullscreen { background: #fafafa; padding: 1.5rem; }
          #price-table-container:fullscreen .fullscreen-hide { display: none !important; }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#f7de00]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Logo"
                    className="object-contain"
                    style={{
                      height: `${logoHeight}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxHeight: '80px'
                    }}
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <Coins size={20} className="text-gray-900" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight">NOMANOGLU</span>
                  </div>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Alarmlar
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Destek</span>
                  </a>
                )}

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-900 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/30">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarmsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarmsCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    İletişim
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Page Title */}
          <div className="mb-6 fullscreen-hide">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Canlı Piyasa Fiyatları</h1>
            <p className="text-gray-500 text-sm">Gerçek zamanlı döviz ve altın fiyatları</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-4 fullscreen-hide">
            <button
              onClick={() => { setFilter('all'); setShowOnlyFavorites(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                filter === 'all' && !showOnlyFavorites
                  ? 'bg-[#f7de00] text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => { setFilter('altin'); setShowOnlyFavorites(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                filter === 'altin' && !showOnlyFavorites
                  ? 'bg-[#f7de00] text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Altın
            </button>
            <button
              onClick={() => { setFilter('doviz'); setShowOnlyFavorites(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                filter === 'doviz' && !showOnlyFavorites
                  ? 'bg-[#f7de00] text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Döviz
            </button>
            <button
              onClick={() => { setFilter('gumus'); setShowOnlyFavorites(false); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                filter === 'gumus' && !showOnlyFavorites
                  ? 'bg-[#f7de00] text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Gümüş
            </button>
            <button
              onClick={() => { setShowOnlyFavorites(true); setFilter('all'); }}
              className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                showOnlyFavorites
                  ? 'bg-[#f7de00] text-gray-900'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Star size={14} className={favorites.length > 0 ? 'fill-current' : ''} />
              <span>Favoriler</span>
              {favorites.length > 0 && (
                <span className="text-xs">({favorites.length})</span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="mb-6 fullscreen-hide">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Altın, döviz veya kod ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#f7de00] focus:ring-2 focus:ring-[#f7de00]/20 transition-all"
              />
            </div>
          </div>

          {/* Price Table */}
          <div id="price-table-container" className="mb-8">
            {prices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f7de00] rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Fiyatlar yükleniyor...</p>
              </div>
            ) : filteredPrices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Star size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-4">
                  {showOnlyFavorites ? 'Henüz favori eklemediniz' : 'Sonuç bulunamadı'}
                </p>
                <button
                  onClick={() => { setShowOnlyFavorites(false); setSearch(''); }}
                  className="px-6 py-2 bg-[#f7de00] text-gray-900 text-sm font-medium rounded-lg transition-all"
                >
                  Tüm Fiyatlara Dön
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f7de00]">
                        <th className="text-left py-4 px-4 sm:px-6 text-gray-900 font-bold text-sm">Ürün</th>
                        <th className="text-right py-4 px-4 sm:px-6 text-gray-900 font-bold text-sm">Alış</th>
                        <th className="text-right py-4 px-4 sm:px-6 text-gray-900 font-bold text-sm">Satış</th>
                        <th className="text-center py-4 px-2 sm:px-4 text-gray-900 font-bold text-sm w-16">
                          <Star size={16} className="inline" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPrices.map((price, index) => {
                        const isFavorite = favorites.includes(price.code);
                        const isRising = price.direction && (price.direction.alis_dir === 'up' || price.direction.satis_dir === 'up');
                        const isFalling = price.direction && (price.direction.alis_dir === 'down' || price.direction.satis_dir === 'down');

                        return (
                          <tr
                            key={price.code}
                            className={`transition-all duration-300 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <td className="py-4 px-4 sm:px-6">
                              <div className="flex items-center space-x-3">
                                <div className="min-w-0">
                                  <p className="text-gray-900 font-semibold text-sm truncate">{price.name}</p>
                                  <p className="text-gray-400 text-xs">{price.code}</p>
                                </div>
                                {isRising && (
                                  <div className="hidden sm:flex items-center px-2 py-1 bg-green-100 rounded-full">
                                    <TrendingUp size={14} className="text-green-600" />
                                  </div>
                                )}
                                {isFalling && (
                                  <div className="hidden sm:flex items-center px-2 py-1 bg-red-100 rounded-full">
                                    <TrendingDown size={14} className="text-red-600" />
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 sm:px-6 text-right">
                              <span className={`font-bold text-sm sm:text-base tabular-nums ${
                                isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                TL{formatPrice(price.calculatedAlis)}
                              </span>
                            </td>

                            <td className="py-4 px-4 sm:px-6 text-right">
                              <span className={`font-bold text-sm sm:text-base tabular-nums ${
                                isRising ? 'text-green-600' : isFalling ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                TL{formatPrice(price.calculatedSatis)}
                              </span>
                            </td>

                            <td className="py-4 px-2 sm:px-4 text-center">
                              <button
                                onClick={() => toggleFavorite(price.code)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Star
                                  size={18}
                                  className={`transition-all ${
                                    isFavorite
                                      ? 'fill-[#f7de00] text-[#f7de00]'
                                      : 'text-gray-300 hover:text-gray-400'
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fullscreen Button */}
            {filteredPrices.length > 0 && (
              <div className="mt-6 text-center fullscreen-hide">
                <button
                  onClick={() => {
                    const container = document.getElementById('price-table-container');
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      container.requestFullscreen();
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 rounded-xl transition-all"
                >
                  <Maximize2 size={18} />
                  <span className="text-sm font-medium">Tam Ekran</span>
                </button>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 fullscreen-hide">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs leading-relaxed">
                Burada yer alan fiyatlar bilgi amaçlıdır ve yatırım danışmanlığı kapsamında değildir.
                Fiyatlar gerçek zamanlı olarak güncellenmekte olup, işlem yapmadan önce şubelerimizle iletişime geçmenizi öneririz.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center space-x-2 mb-4">
                  {logoBase64 ? (
                    <img
                      src={logoBase64}
                      alt="Logo"
                      className="object-contain"
                      style={{
                        height: `${Math.min(logoHeight, 40)}px`,
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                        maxWidth: '160px'
                      }}
                    />
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-[#f7de00] flex items-center justify-center">
                        <Coins size={18} className="text-gray-900" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">NOMANOGLU</span>
                    </>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  1967'den bu yana güvenilir kuyumculuk hizmeti.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">Hızlı Linkler</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Fiyatlar</Link></li>
                  <li><Link href="/piyasalar" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Piyasalar</Link></li>
                  <li><Link href="/alarms" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Alarmlar</Link></li>
                  <li><Link href="/iletisim" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">İletişim</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">İletişim</h4>
                <ul className="space-y-2">
                  {contactPhone && (
                    <li>
                      <a href={`tel:${contactPhone}`} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                        {contactPhone}
                      </a>
                    </li>
                  )}
                  {contactEmail && (
                    <li>
                      <a href={`mailto:${contactEmail}`} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                        {contactEmail}
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {/* App Download */}
              <div>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">Mobil Uygulama</h4>
                <div className="flex flex-col space-y-2">
                  <a href="#" className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span className="text-white text-xs font-medium">App Store</span>
                  </a>
                  <a href="#" className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm10.84-8.5l2.64-2.64 4.37 2.52c.5.29.5 1.05 0 1.34l-4.37 2.52L13.84 12zM3.85 3.65L13.69 12 3.85 20.35V3.65z"/>
                    </svg>
                    <span className="text-white text-xs font-medium">Google Play</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-xs">
                © 2024 Nomanoğlu Kuyumculuk. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center space-x-4">
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Facebook size={18} />
                  </a>
                )}
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors">
                    <Twitter size={18} />
                  </a>
                )}
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                    <Instagram size={18} />
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                    <Youtube size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
