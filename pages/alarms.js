import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWebSocket } from '../hooks/useWebSocket';
import { ArrowLeft, Plus, Trash2, Bell, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, X, AlertCircle, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Alarms() {
  const { prices } = useWebSocket();
  const [alarms, setAlarms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [triggeredAlarms, setTriggeredAlarms] = useState([]);
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');

  // Form state
  const [formData, setFormData] = useState({
    productCode: '',
    targetPrice: '',
    priceType: 'satis', // 'alis' veya 'satis'
    condition: 'above', // 'above' veya 'below'
    note: ''
  });

  // LocalStorage'dan alarmları yükle
  useEffect(() => {
    const savedAlarms = localStorage.getItem('priceAlarms');
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms));
    }

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

    // Bildirim izni iste
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Alarmları kontrol et
  useEffect(() => {
    if (alarms.length === 0 || prices.length === 0) return;

    alarms.forEach(alarm => {
      if (alarm.triggered) return; // Zaten tetiklendi

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
        // Alarmı tetikle
        triggerAlarm(alarm, product, currentPrice);
      }
    });
  }, [prices, alarms]);

  const triggerAlarm = (alarm, product, currentPrice) => {
    // Alarmı tetiklenmiş olarak işaretle
    const updatedAlarms = alarms.map(a => 
      a.id === alarm.id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
    );
    setAlarms(updatedAlarms);
    localStorage.setItem('priceAlarms', JSON.stringify(updatedAlarms));

    // Tetiklenen alarm listesine ekle
    const triggeredAlarm = {
      ...alarm,
      product,
      currentPrice,
      triggeredAt: new Date().toISOString()
    };
    setTriggeredAlarms(prev => [triggeredAlarm, ...prev]);

    // Tarayıcı bildirimi gönder
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔔 Fiyat Alarmı!', {
        body: `${product.name} (${product.code}) - ${alarm.priceType === 'alis' ? 'Alış' : 'Satış'}: ₺${currentPrice.toFixed(2)}`,
        icon: '/icon.png',
        tag: alarm.id
      });
    }

    // Ses çal (opsiyonel)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    audio.play().catch(() => {}); // Ses çalmazsa sessizce geç
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

    // Formu temizle
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
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top Navbar - Elegant Gold Theme */}
        <nav className="sticky top-0 z-50 shadow-sm backdrop-blur-md bg-opacity-95" style={{backgroundColor: '#f7de00', borderBottom: '2px solid #d4c000'}}>
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
                )}
              </Link>

              {/* Nav Links - Center */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/" className="px-5 py-2.5 text-sm font-medium text-gray-900 hover:text-gray-900 rounded-t-lg transition-all hover:bg-white/40">
                  Anasayfa
                </Link>
                <Link href="/piyasalar" className="px-5 py-2.5 text-sm font-medium text-gray-900 hover:text-gray-900 rounded-t-lg transition-all hover:bg-white/40">
                  Piyasalar
                </Link>
                <Link href="/alarms" className="px-5 py-2.5 text-sm font-semibold text-gray-900 border-b-2 border-gray-900 rounded-t-lg transition-all" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
                  Alarmlar
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
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                  <Bell size={32} className="text-amber-600" />
                  <span>Fiyat Alarmları</span>
                </h1>
                <p className="text-gray-600 mt-2">İstediğiniz fiyat seviyesine ulaşıldığında bildirim alın</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={20} />
                <span>Yeni Alarm Oluştur</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aktif Alarmlar</p>
                    <p className="text-3xl font-bold text-blue-600">{activeAlarms.length}</p>
                  </div>
                  <Bell size={40} className="text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tetiklenen</p>
                    <p className="text-3xl font-bold text-green-600">{pastAlarms.length}</p>
                  </div>
                  <CheckCircle size={40} className="text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Toplam</p>
                    <p className="text-3xl font-bold text-purple-600">{alarms.length}</p>
                  </div>
                  <AlertTriangle size={40} className="text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Alarms Notification */}
          {triggeredAlarms.length > 0 && (
            <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center space-x-2">
                    <Bell className="animate-bounce" size={24} />
                    <span>🔔 Yeni Alarm Tetiklendi!</span>
                  </h3>
                  <div className="space-y-2">
                    {triggeredAlarms.slice(0, 3).map(alarm => (
                      <div key={alarm.id} className="bg-white rounded-lg p-4 border border-green-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{alarm.product.name}</p>
                            <p className="text-sm text-gray-600">
                              Hedef: ₺{alarm.targetPrice.toFixed(2)} → Güncel: ₺{alarm.currentPrice.toFixed(2)}
                            </p>
                          </div>
                          <CheckCircle className="text-green-600" size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearTriggeredAlarms}
                  className="ml-4 p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-green-700" />
                </button>
              </div>
            </div>
          )}

          {/* Active Alarms */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktif Alarmlar</h2>
            {activeAlarms.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">Henüz aktif alarm yok</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
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
                    <div key={alarm.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                          <span className="font-bold text-amber-600">₺{alarm.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Güncel Fiyat:</span>
                          <span className="font-bold text-gray-900">₺{currentPrice.toFixed(2)}</span>
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
                  <div key={alarm.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 opacity-75">
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
                        <span className="font-bold text-gray-700">₺{alarm.targetPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-green-600 font-semibold">
                        ✓ Tetiklendi: {alarm.triggeredAt && new Date(alarm.triggeredAt).toLocaleString('tr-TR')}
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
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="bg-gradient-to-r from-amber-400 to-amber-600 border-b border-amber-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-white drop-shadow-md">Yeni Alarm Oluştur</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Seç *</label>
                  <select
                    value={formData.productCode}
                    onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Fiyat (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({...formData, targetPrice: e.target.value})}
                    placeholder="Örn: 35.50"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Not (Opsiyonel)</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    placeholder="Kendinize bir not ekleyin..."
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddAlarm}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <Bell size={18} />
                  <span>Alarm Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 mt-12">
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

              {/* Kurumsal */}
              <div>
                <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Kurumsal</h4>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                      Hakkımızda
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                      Vizyonumuz
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                      Kalite Politikası
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm hover:text-amber-400 transition-colors">
                      İnsan Kaynakları
                    </a>
                  </li>
                </ul>
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

