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
                <Link href="/alarms" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Alarmlar
                  {activeAlarmsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {activeAlarmsCount}
                    </span>
                  )}
                </Link>
                <Link href="/iletisim" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
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
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg"
                  >
                    <span>WhatsApp</span>
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
                  <Link href="/alarms" className="px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                    <span>Alarmlar</span>
                    {activeAlarmsCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Page Header - Modern Tek Satır */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              <h1 className="text-2xl font-bold text-gray-900">İletişim & Şubelerimiz</h1>
            </div>
            <div className="hidden sm:block h-5 w-px bg-gray-200"></div>
            <p className="hidden sm:block text-sm text-gray-400 font-medium">Türkiye genelinde {branches.length} şubemizle hizmetinizdeyiz</p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Phone size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Telefon</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{contactPhone}</p>
                  </div>
                </div>
              </a>
            )}

            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Mail size={22} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">E-posta</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{contactEmail}</p>
                  </div>
                </div>
              </a>
            )}

            {workingHours && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6 shadow-sm">
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
                    className="w-full sm:w-56 pl-9 pr-4 py-2.5 bg-gray-100 border-0 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* City Filters */}
              {cities.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto mt-4 pb-1">
                  <button
                    onClick={() => setSelectedCity('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                      selectedCity === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tümü
                  </button>
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                        selectedCity === city
                          ? 'bg-blue-600 text-white shadow-md'
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
                  <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
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
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                            <MapPin size={18} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{branch.name}</h3>
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
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
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all hover:shadow-lg"
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
