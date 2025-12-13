import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, Plus, Trash2, Bell, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, X, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Coins } from 'lucide-react';

export default function Alarms() {
  const { prices: websocketPrices } = useWebSocket();

  // Custom fiyatları filtrele (panelden oluşturulan fiyatlar)
  const prices = websocketPrices.filter(p => p.isCustom === true);
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64,
    contactPhone, contactEmail,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube, socialWhatsapp
  } = useSettings();
  const [alarms, setAlarms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [triggeredAlarms, setTriggeredAlarms] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <title>Fiyat Alarmları - NOMANOĞLU</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
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
                <Link href="/piyasalar" className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-900 hover:bg-white/20 rounded-lg transition-colors">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg">
                  Alarmlar
                  {activeAlarms.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarms.length}
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
                  <Link href="/piyasalar" className="px-4 py-3 text-sm font-medium text-gray-800 hover:bg-white/20 rounded-lg">
                    Piyasalar
                  </Link>
                  <Link href="/alarms" className="px-4 py-3 text-sm font-semibold text-gray-900 bg-white/30 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarms.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {activeAlarms.length}
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
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <Bell size={28} className="text-[#b8860b]" />
                  <span>Fiyat Alarmları</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">İstediğiniz fiyat seviyesine ulaşıldığında bildirim alın</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#f7de00] hover:bg-[#e5cc00] text-gray-900 font-semibold rounded-lg transition-all"
              >
                <Plus size={20} />
                <span>Yeni Alarm</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Aktif Alarmlar</p>
                  <p className="text-2xl font-bold text-blue-600">{activeAlarms.length}</p>
                </div>
                <Bell size={32} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tetiklenen</p>
                  <p className="text-2xl font-bold text-green-600">{pastAlarms.length}</p>
                </div>
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Toplam</p>
                  <p className="text-2xl font-bold text-purple-600">{alarms.length}</p>
                </div>
                <AlertTriangle size={32} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Triggered Alarms Notification */}
          {triggeredAlarms.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center space-x-2">
                    <Bell className="animate-bounce" size={20} />
                    <span>Yeni Alarm Tetiklendi!</span>
                  </h3>
                  <div className="space-y-2">
                    {triggeredAlarms.slice(0, 3).map(alarm => (
                      <div key={alarm.id} className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{alarm.product.name}</p>
                            <p className="text-sm text-gray-600">
                              Hedef: TL{alarm.targetPrice.toFixed(2)} - Güncel: TL{alarm.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <CheckCircle className="text-green-600" size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearTriggeredAlarms}
                  className="ml-4 p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-green-700" />
                </button>
              </div>
            </div>
          )}

          {/* Active Alarms */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktif Alarmlar</h2>
            {activeAlarms.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Henüz aktif alarm yok</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#f7de00] text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  <Plus size={20} />
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
                    <div key={alarm.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#f7de00] transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{getProductName(alarm.productCode)}</h3>
                          <p className="text-sm text-gray-500">{alarm.productCode}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Hedef Fiyat:</span>
                          <span className="font-bold text-[#b8860b]">TL{alarm.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Güncel Fiyat:</span>
                          <span className="font-bold text-gray-900">TL{currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Fiyat Tipi:</span>
                          <span className="font-semibold text-gray-700">
                            {alarm.priceType === 'alis' ? 'Alış' : 'Satış'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Koşul:</span>
                          <span className="flex items-center space-x-1">
                            {alarm.condition === 'above' ? (
                              <>
                                <TrendingUp size={16} className="text-green-600" />
                                <span className="text-sm font-semibold text-green-600">Üstüne Çıkınca</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown size={16} className="text-red-600" />
                                <span className="text-sm font-semibold text-red-600">Altına Düşünce</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {alarm.note && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-gray-700">{alarm.note}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mt-3">
                        Oluşturulma: {new Date(alarm.createdAt).toLocaleString('tr-TR')}
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tetiklenmiş Alarmlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastAlarms.map(alarm => (
                  <div key={alarm.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-700">{getProductName(alarm.productCode)}</h3>
                        <p className="text-sm text-gray-500">{alarm.productCode}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <button
                          onClick={() => handleDeleteAlarm(alarm.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Hedef Fiyat:</span>
                        <span className="font-bold text-gray-700">TL{alarm.targetPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
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
            <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
              <div className="bg-[#f7de00] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Yeni Alarm Oluştur</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-900" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seç *</label>
                  <select
                    value={formData.productCode}
                    onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:border-[#f7de00] focus:ring-2 focus:ring-[#f7de00]/20 focus:outline-none transition-all"
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
                      className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                        formData.priceType === 'alis'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alış Fiyatı
                    </button>
                    <button
                      onClick={() => setFormData({...formData, priceType: 'satis'})}
                      className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                        formData.priceType === 'satis'
                          ? 'bg-red-600 text-white'
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
                      className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                        formData.condition === 'above'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp size={18} />
                      <span>Üstüne Çıkınca</span>
                    </button>
                    <button
                      onClick={() => setFormData({...formData, condition: 'below'})}
                      className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 ${
                        formData.condition === 'below'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingDown size={18} />
                      <span>Altına Düşünce</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Fiyat (TL) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({...formData, targetPrice: e.target.value})}
                    placeholder="Örn: 35.50"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-[#f7de00] focus:ring-2 focus:ring-[#f7de00]/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Not (Opsiyonel)</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="Kendinize bir not ekleyin..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-[#f7de00] focus:ring-2 focus:ring-[#f7de00]/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddAlarm}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-[#f7de00] hover:bg-[#e5cc00] text-gray-900 rounded-lg transition-colors font-semibold"
                >
                  <Bell size={18} />
                  <span>Alarm Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-8">
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
