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
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Alarmlar
                  {activeAlarms.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarms.length}
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
                    {isConnected ? 'Canlı' : 'Bağlanıyor...'}
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
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarms.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarms.length}
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
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fiyat Alarmları</h1>
              <p className="text-sm text-gray-500 mt-1">İstediğiniz fiyat seviyesine ulaşıldığında bildirim alın</p>
            </div>
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

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Fiyatlar</Link>
                <Link href="/piyasalar" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Piyasalar</Link>
                <Link href="/alarms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Alarmlar</Link>
                <Link href="/iletisim" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">İletişim</Link>
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
