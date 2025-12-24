import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Plus, Trash2, Bell, TrendingUp, TrendingDown, CheckCircle, X, ArrowRight, Activity } from 'lucide-react';

export default function Alarms() {
  const { prices: websocketPrices, isConnected } = useWebSocket();

  // Custom fiyatları filtrele (panelden oluşturulan fiyatlar)
  const prices = websocketPrices.filter(p => p.isCustom === true);
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64,
    socialWhatsapp
  } = useSettings();
  const [alarms, setAlarms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [triggeredAlarms, setTriggeredAlarms] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');

  const [formData, setFormData] = useState({
    productCode: '',
    targetPrice: '',
    priceType: 'satis',
    condition: 'above',
    note: ''
  });

  useEffect(() => {
    const savedAlarms = localStorage.getItem('priceAlarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (alarms.length === 0 || prices.length === 0) return;

    alarms.forEach(alarm => {
      if (alarm.triggered) return;

      const product = prices.find(p => p.code === alarm.productCode);
      if (!product) return;

      const currentPrice = alarm.priceType === 'alis'
        ? product.calculatedAlis
        : product.calculatedSatis;

      let shouldTrigger = false;
      if (alarm.condition === 'above' && currentPrice >= alarm.targetPrice) {
        shouldTrigger = true;
      } else if (alarm.condition === 'below' && currentPrice <= alarm.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        triggerAlarm(alarm, product, currentPrice);
      }
    });
  }, [prices, alarms]);

  const triggerAlarm = (alarm, product, currentPrice) => {
    const updatedAlarms = alarms.map(a =>
      a.id === alarm.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
    );
    setAlarms(updatedAlarms);
    localStorage.setItem('priceAlarms', JSON.stringify(updatedAlarms));

    const triggeredAlarm = {
      ...alarm,
      product,
      currentPrice,
      triggeredAt: new Date().toISOString()
    };
    setTriggeredAlarms(prev => [triggeredAlarm, ...prev]);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fiyat Alarmı!', {
        body: `${product.name} (${product.code}) - ${alarm.priceType === 'alis' ? 'Alış' : 'Satış'}: TL${currentPrice.toFixed(2)}`,
        icon: '/icon.png',
        tag: alarm.id
      });
    }
  };

  const handleAddAlarm = () => {
    if (!formData.productCode || !formData.targetPrice) {
      alert('Lütfen ürün ve hedef fiyat seçin!');
      return;
    }

    const newAlarm = {
      id: Date.now().toString(),
      ...formData,
      targetPrice: parseFloat(formData.targetPrice),
      createdAt: new Date().toISOString(),
      triggered: false
    };

    const updatedAlarms = [...alarms, newAlarm];
    setAlarms(updatedAlarms);
    localStorage.setItem('priceAlarms', JSON.stringify(updatedAlarms));

    setFormData({
      productCode: '',
      targetPrice: '',
      priceType: 'satis',
      condition: 'above',
      note: ''
    });
    setShowModal(false);
  };

  const handleDeleteAlarm = (id) => {
    const updatedAlarms = alarms.filter(a => a.id !== id);
    setAlarms(updatedAlarms);
    localStorage.setItem('priceAlarms', JSON.stringify(updatedAlarms));
  };

  const clearTriggeredAlarms = () => {
    setTriggeredAlarms([]);
  };

  const getProductName = (code) => {
    const product = prices.find(p => p.code === code);
    return product ? product.name : code;
  };

  const activeAlarms = alarms.filter(a => !a.triggered);
  const pastAlarms = alarms.filter(a => a.triggered);

  return (
    <>
      <Head>
        <title>Fiyat Alarmları - AKA Kuyumculuk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Header - Mavi gradient */}
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="AKA Kuyumculuk"
                    className="object-contain brightness-0 invert"
                    style={{
                      height: `${Math.min(logoHeight, 56)}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`
                    }}
                  />
                ) : (
                  <span className="text-xl font-bold text-white">AKA Kuyumculuk</span>
                )}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/" className="px-4 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Fiyatlar
                </Link>
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-white bg-white/20 rounded-lg backdrop-blur-sm">
                  Alarmlar
                  {activeAlarms.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarms.length}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-3">
                {/* WhatsApp */}
                {socialWhatsapp && (
                  <a
                    href={`https://wa.me/${socialWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 text-sm font-medium rounded-lg transition-all hover:shadow-lg"
                  >
                    <span>Destek</span>
                    <ArrowRight size={16} />
                  </a>
                )}

                {/* Mobile Menu */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-white/10">
                <nav className="flex flex-col space-y-1">
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-blue-100 hover:bg-white/10 rounded-lg">
                    Fiyatlar
                  </Link>
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-blue-100 hover:bg-white/10 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-white bg-white/20 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarms.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarms.length}
                      </span>
                    )}
                  </Link>
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-blue-100 hover:bg-white/10 rounded-lg">
                    İletişim
                  </Link>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Yeni Alarm Butonu */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all hover:shadow-lg"
            >
              <Plus size={18} />
              <span>Yeni Alarm</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">{activeAlarms.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tetiklenen</p>
                  <p className="text-2xl font-bold text-gray-900">{pastAlarms.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{alarms.length}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Activity size={20} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Alarms Notification */}
          {triggeredAlarms.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center space-x-2">
                    <Bell className="animate-bounce" size={16} />
                    <span>Yeni Alarm Tetiklendi!</span>
                  </h3>
                  <div className="space-y-2">
                    {triggeredAlarms.slice(0, 3).map(alarm => (
                      <div key={alarm.id} className="bg-white rounded-xl p-3 border border-green-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{alarm.product.name}</p>
                            <p className="text-xs text-gray-500">
                              Hedef: TL{alarm.targetPrice.toFixed(2)} - Güncel: TL{alarm.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <CheckCircle className="text-green-600" size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearTriggeredAlarms}
                  className="ml-4 p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X size={16} className="text-green-700" />
                </button>
              </div>
            </div>
          )}

          {/* Active Alarms */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktif Alarmlar</h2>
            {activeAlarms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-sm mb-4">Henüz aktif alarm yok</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>İlk Alarmı Oluştur</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAlarms.map(alarm => {
                  const product = prices.find(p => p.code === alarm.productCode);
                  const currentPrice = product
                    ? (alarm.priceType === 'alis' ? product.calculatedAlis : product.calculatedSatis)
                    : 0;

                  return (
                    <div key={alarm.id} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{getProductName(alarm.productCode)}</h3>
                          <p className="text-xs text-gray-400">{alarm.productCode}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Hedef Fiyat</span>
                          <span className="font-semibold text-blue-600">TL{alarm.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Güncel Fiyat</span>
                          <span className="font-semibold text-gray-900">TL{currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Tip</span>
                          <span className="text-gray-700">{alarm.priceType === 'alis' ? 'Alış' : 'Satış'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Koşul</span>
                          <span className="flex items-center space-x-1">
                            {alarm.condition === 'above' ? (
                              <>
                                <TrendingUp size={14} className="text-green-600" />
                                <span className="text-green-600 font-medium">Üstüne Çıkınca</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown size={14} className="text-red-600" />
                                <span className="text-red-600 font-medium">Altına Düşünce</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {alarm.note && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-4">
                          <p className="text-xs text-gray-600">{alarm.note}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-4">
                        {new Date(alarm.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Alarms */}
          {pastAlarms.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tetiklenmiş Alarmlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastAlarms.map(alarm => (
                  <div key={alarm.id} className="bg-white rounded-2xl p-5 border border-gray-200 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-600">{getProductName(alarm.productCode)}</h3>
                        <p className="text-xs text-gray-400">{alarm.productCode}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-500" size={18} />
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Hedef Fiyat</span>
                        <span className="font-medium text-gray-600">TL{alarm.targetPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        Tetiklendi: {alarm.triggeredAt && new Date(alarm.triggeredAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Add Alarm Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Yeni Alarm Oluştur</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seç</label>
                  <select
                    value={formData.productCode}
                    onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ürün seçin...</option>
                    {prices.map(p => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat Tipi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormData({...formData, priceType: 'alis'})}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        formData.priceType === 'alis'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alış Fiyatı
                    </button>
                    <button
                      onClick={() => setFormData({...formData, priceType: 'satis'})}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        formData.priceType === 'satis'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Satış Fiyatı
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Koşul</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormData({...formData, condition: 'above'})}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
                        formData.condition === 'above'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp size={16} />
                      <span>Üstüne Çıkınca</span>
                    </button>
                    <button
                      onClick={() => setFormData({...formData, condition: 'below'})}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
                        formData.condition === 'below'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingDown size={16} />
                      <span>Altına Düşünce</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Fiyat (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({...formData, targetPrice: e.target.value})}
                    placeholder="Örn: 35.50"
                    className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Not (Opsiyonel)</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="Kendinize bir not ekleyin..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddAlarm}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg"
                >
                  <Bell size={16} />
                  <span>Alarm Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer - Mavi gradient */}
        <footer className="mt-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800">
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
                      className="h-10 object-contain brightness-0 invert"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">AKA Kuyumculuk</span>
                  )}
                </div>
                <p className="text-sm text-blue-100">
                  Güvenilir kuyumculuk hizmeti
                </p>
              </div>

              {/* Navigation Links */}
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white mb-4">Hızlı Erişim</h3>
                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                  <Link href="/" className="text-sm text-blue-100 hover:text-white transition-colors">Fiyatlar</Link>
                  <Link href="/piyasalar" className="text-sm text-blue-100 hover:text-white transition-colors">Piyasalar</Link>
                  <Link href="/alarms" className="text-sm text-blue-100 hover:text-white transition-colors">Alarmlar</Link>
                  <Link href="/iletisim" className="text-sm text-blue-100 hover:text-white transition-colors">İletişim</Link>
                </nav>
              </div>

              {/* Mobile App Links */}
              <div className="text-center md:text-right">
                <h3 className="text-sm font-semibold text-white mb-4">Mobil Uygulama</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    App Store
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm"
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
            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-blue-200">
                  © 2025 AKA Kuyumculuk. Tüm hakları saklıdır.
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
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
