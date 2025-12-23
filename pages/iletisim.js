import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSettings } from '../contexts/SettingsContext';
import { Menu, MapPin, Phone, Mail, Clock, Building2, Navigation, X, Send, User, MessageSquare, CheckCircle, AlertCircle, ChevronDown, Search, ArrowRight } from 'lucide-react';

export default function Iletisim() {
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64,
    contactPhone, contactEmail, contactAddress, workingHours,
    socialWhatsapp
  } = useSettings();
  const [branches, setBranches] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [activeAlarmsCount, setActiveAlarmsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [branchSearch, setBranchSearch] = useState('');

  // İletişim formu state'leri
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001')+'/api/branches')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBranches(data.data);
        }
      })
      .catch(err => console.error('Şube yükleme hatası:', err));

    const loadAlarmCount = () => {
      const savedAlarms = localStorage.getItem('priceAlarms');
      if (savedAlarms) {
        const alarms = JSON.parse(savedAlarms);
        const activeCount = alarms.filter(a => !a.triggered).length;
        setActiveAlarmsCount(activeCount);
      }
    };
    loadAlarmCount();
  }, []);

  const cities = [...new Set(branches.map(b => b.city))].sort();
  const filteredBranches = branches.filter(b => {
    const matchesCity = selectedCity === 'all' || b.city === selectedCity;
    const matchesSearch = branchSearch === '' ||
      b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(branchSearch.toLowerCase()) ||
      b.address.toLowerCase().includes(branchSearch.toLowerCase());
    return matchesCity && matchesSearch;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });

    // Form validasyonu
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({ type: 'error', message: 'Lütfen zorunlu alanları doldurun.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001') + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setFormStatus({ type: 'success', message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setFormStatus({ type: 'error', message: data.message || 'Mesaj gönderilirken bir hata oluştu.' });
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      setFormStatus({ type: 'success', message: 'Mesajınız alındı. En kısa sürede size dönüş yapacağız.' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>İletişim & Şubelerimiz - AKA Kuyumculuk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
                <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
                <Link href="/iletisim" className="text-sm font-medium text-blue-600">
                  İletişim
                </Link>
              </nav>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
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
                  <Link href="/" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
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
                  <Link href="/iletisim" className="px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">İletişim & Şubelerimiz</h1>
            <p className="text-gray-500">Türkiye genelinde {branches.length} şubemizle hizmetinizdeyiz</p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Phone size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telefon</p>
                    <p className="text-sm font-semibold text-gray-900">{contactPhone}</p>
                  </div>
                </div>
              </a>
            )}

            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition-colors group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Mail size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-posta</p>
                    <p className="text-sm font-semibold text-gray-900">{contactEmail}</p>
                  </div>
                </div>
              </a>
            )}

            {workingHours && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Çalışma Saatleri</p>
                    <p className="text-sm font-semibold text-gray-900">{workingHours}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Branches Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
            {/* Header with Search and Filter */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Şubelerimiz</h2>
                    <p className="text-xs text-gray-500">{filteredBranches.length} şube bulundu</p>
                  </div>
                </div>
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Şube ara..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="w-full sm:w-56 pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* City Filters */}
              {cities.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto mt-4 pb-1">
                  <button
                    onClick={() => setSelectedCity('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedCity === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        selectedCity === city
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {city} ({branches.filter(b => b.city === city).length})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Branch List */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredBranches.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 size={40} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-sm">
                    {branchSearch ? 'Aramanızla eşleşen şube bulunamadı.' : 'Henüz şube eklenmedi.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredBranches.map((branch, index) => (
                    <div key={branch._id || index} className="group">
                      {/* Collapsed View */}
                      <button
                        onClick={() => setExpandedBranch(expandedBranch === branch._id ? null : branch._id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <MapPin size={18} className="text-gray-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm truncate">{branch.name}</h3>
                            <p className="text-xs text-gray-500">{branch.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          {branch.phone && (
                            <a
                              href={`tel:${branch.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Phone size={12} />
                              <span>Ara</span>
                            </a>
                          )}
                          {branch.mapLink && (
                            <a
                              href={branch.mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              <Navigation size={12} />
                              <span>Yol Tarifi</span>
                            </a>
                          )}
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform duration-200 ${
                              expandedBranch === branch._id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded View */}
                      {expandedBranch === branch._id && (
                        <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                          <div className="pt-4 space-y-3">
                            {/* Address */}
                            <div className="flex items-start space-x-3">
                              <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700 text-sm">{branch.address}</p>
                            </div>
                            {/* Phone */}
                            {branch.phone && (
                              <div className="flex items-center space-x-3">
                                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                <a href={`tel:${branch.phone}`} className="text-gray-700 text-sm hover:text-blue-600 transition-colors">
                                  {branch.phone}
                                </a>
                              </div>
                            )}
                            {/* Email */}
                            {branch.email && (
                              <div className="flex items-center space-x-3">
                                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                                <a href={`mailto:${branch.email}`} className="text-gray-700 text-sm hover:text-blue-600 transition-colors">
                                  {branch.email}
                                </a>
                              </div>
                            )}
                            {/* Working Hours */}
                            {branch.workingHours && (
                              <div className="flex items-center space-x-3">
                                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                                <p className="text-gray-700 text-sm">{branch.workingHours}</p>
                              </div>
                            )}
                            {/* Mobile Action Buttons */}
                            <div className="flex items-center space-x-2 pt-2 sm:hidden">
                              {branch.phone && (
                                <a
                                  href={`tel:${branch.phone}`}
                                  className="flex-1 flex items-center justify-center space-x-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Phone size={14} />
                                  <span>Ara</span>
                                </a>
                              )}
                              {branch.mapLink && (
                                <a
                                  href={branch.mapLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center space-x-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  <Navigation size={14} />
                                  <span>Yol Tarifi</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Bize Ulaşın</h2>
                  <p className="text-xs text-gray-500">Sorularınız için formu doldurun</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6">
              {/* Status Message */}
              {formStatus.message && (
                <div className={`mb-6 p-4 rounded-xl flex items-start space-x-3 ${
                  formStatus.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {formStatus.type === 'success' ? (
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${formStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {formStatus.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Adınız ve soyadınız"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="ornek@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      placeholder="0555 555 55 55"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konu
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Konu seçin...</option>
                    <option value="genel">Genel Bilgi</option>
                    <option value="satis">Satış & Fiyat</option>
                    <option value="sube">Şube Bilgisi</option>
                    <option value="sikayet">Şikayet & Öneri</option>
                    <option value="diger">Diğer</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesajınız <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  placeholder="Mesajınızı buraya yazın..."
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gönderiliyor...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Mesaj Gönder</span>
                  </>
                )}
              </button>
            </form>
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
      `}</style>
    </>
  );
}
