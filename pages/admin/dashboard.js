import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useWebSocket } from '../../hooks/useWebSocket';
import { TrendingUp, LogOut, Plus, Edit2, Trash2, X, Save, AlertCircle, RefreshCw, Settings, FileText, Users, GripVertical, Building2, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { prices: websocketPrices, isConnected, lastUpdate: wsLastUpdate } = useWebSocket();
  const [sourcePrices, setSourcePrices] = useState([]);
  const [customPrices, setCustomPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('');
  const [maxDisplayItems, setMaxDisplayItems] = useState(20);
  const [logoBase64, setLogoBase64] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoHeight, setLogoHeight] = useState(48); // px
  const [logoWidth, setLogoWidth] = useState('auto'); // 'auto' veya px değeri

  // İletişim Bilgileri state
  const [contactPhone, setContactPhone] = useState('+90 (XXX) XXX XX XX');
  const [contactEmail, setContactEmail] = useState('info@nomanoglu.com');
  const [contactAddress, setContactAddress] = useState('Istanbul, Turkiye');
  const [workingHours, setWorkingHours] = useState('Pzt - Cmt: 09:00 - 19:00');
  const [workingHoursNote, setWorkingHoursNote] = useState('Pazar: Kapali');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('905322904601');

  // Tab state
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'family' | 'articles' | 'branches' | 'settings'

  // Drag & Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  // Family Cards state
  const [familyCards, setFamilyCards] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyFormData, setFamilyFormData] = useState({
    label: '',
    title: '',
    description: '',
    icon: 'TrendingUp',
    order: 1
  });

  // Articles state
  const [articles, setArticles] = useState([]);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleFormData, setArticleFormData] = useState({
    category: 'Yatırım',
    title: '',
    description: '',
    content: '',
    icon: 'Coins',
    order: 1
  });

  // Branches state
  const [branches, setBranches] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchFormData, setBranchFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    workingHours: '09:00 - 18:00',
    mapLink: ''
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'doviz',
    alisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    },
    satisConfig: {
      sourceCode: '',
      sourceType: 'satis',
      multiplier: 1,
      addition: 0
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, []);

  // WebSocket'ten gelen fiyatları kaynak fiyat olarak kullan
  useEffect(() => {
    if (websocketPrices && websocketPrices.length > 0) {
      // WebSocket'ten gelen fiyatları kaynak fiyat formatına dönüştür
      const formattedPrices = websocketPrices.map(price => ({
        code: price.code,
        name: price.name,
        rawAlis: price.calculatedAlis || 0,
        rawSatis: price.calculatedSatis || 0
      }));
      setSourcePrices(formattedPrices);
      setLastUpdate(new Date().toISOString());
    }
  }, [websocketPrices]);

  // Son güncellemeden bu yana geçen süreyi hesapla
  useEffect(() => {
    const updateTimeSince = () => {
      if (!lastUpdate) {
        setTimeSinceUpdate('Bekleniyor...');
        return;
      }

      const now = new Date();
      const updateTime = new Date(lastUpdate);
      const diffMs = now - updateTime;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 5) {
        setTimeSinceUpdate('Şimdi');
      } else if (diffSec < 60) {
        setTimeSinceUpdate(`${diffSec} saniye önce`);
      } else if (diffMin < 60) {
        setTimeSinceUpdate(`${diffMin} dakika önce`);
      } else {
        setTimeSinceUpdate(`${diffHour} saat önce`);
      }
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const loadData = async () => {
    try {
      console.log('🔄 Admin Panel - Veri yükleniyor...');
      const [customRes, settingsRes, familyRes, articlesRes, branchesRes] = await Promise.all([
        axios.get(`${apiUrl}/api/custom-prices`),
        axios.get(`${apiUrl}/api/settings`),
        axios.get(`${apiUrl}/api/family-cards`),
        axios.get(`${apiUrl}/api/articles`),
        axios.get(`${apiUrl}/api/branches`)
      ]);
      
      if (customRes.data.success) {
        setCustomPrices(customRes.data.data);
        console.log(`✅ ${customRes.data.data.length} custom fiyat yüklendi`);
      }

      if (settingsRes.data.success) {
        const s = settingsRes.data.data;
        setMaxDisplayItems(s.maxDisplayItems || 20);
        setLogoBase64(s.logoBase64 || '');
        setLogoHeight(s.logoHeight || 48);
        setLogoWidth(s.logoWidth || 'auto');
        // İletişim bilgileri
        setContactPhone(s.contactPhone || '+90 (XXX) XXX XX XX');
        setContactEmail(s.contactEmail || 'info@nomanoglu.com');
        setContactAddress(s.contactAddress || 'Istanbul, Turkiye');
        setWorkingHours(s.workingHours || 'Pzt - Cmt: 09:00 - 19:00');
        setWorkingHoursNote(s.workingHoursNote || 'Pazar: Kapali');
        setSocialFacebook(s.socialFacebook || '');
        setSocialTwitter(s.socialTwitter || '');
        setSocialInstagram(s.socialInstagram || '');
        setSocialYoutube(s.socialYoutube || '');
        setSocialTiktok(s.socialTiktok || '');
        setSocialWhatsapp(s.socialWhatsapp || '905322904601');
        console.log('✅ Ayarlar yüklendi');
      }

      if (familyRes.data.success) {
        setFamilyCards(familyRes.data.data);
        console.log(`✅ ${familyRes.data.data.length} family kart yüklendi`);
      }

      if (articlesRes.data.success) {
        setArticles(articlesRes.data.data);
        console.log(`✅ ${articlesRes.data.data.length} makale yüklendi`);
      }

      if (branchesRes.data.success) {
        setBranches(branchesRes.data.data);
        console.log(`✅ ${branchesRes.data.data.length} şube yüklendi`);
      }

      console.log('✅ Tüm veriler başarıyla yüklendi! (Fiyatlar WebSocket\'ten gelecek)');
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      console.error('Error details:', error.response || error.message);
      if (error.response?.status === 401) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      name: '',
      code: '',
      category: 'doviz',
      alisConfig: {
        sourceCode: sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      },
      satisConfig: {
        sourceCode: sourcePrices[0]?.code || '',
        sourceType: 'satis',
        multiplier: 1,
        addition: 0
      }
    });
    setShowModal(true);
  };

  const openEditModal = (price) => {
    setEditingPrice(price);
    setFormData(price);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingPrice) {
        await axios.put(`${apiUrl}/api/custom-prices/${editingPrice.id}`, formData);
      } else {
        // Yeni fiyat oluşturulurken order değerini en sona ekle
        const newPriceData = {
          ...formData,
          order: customPrices.length
        };
        await axios.post(`${apiUrl}/api/custom-prices`, newPriceData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu fiyatı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/custom-prices/${id}`);
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        alert('Lütfen sadece resim dosyası yükleyin!');
        e.target.value = '';
        return;
      }
      
      // Dosya boyutu kontrolü (500KB önerilen limit)
      const fileSizeMB = file.size / 1024 / 1024;
      if (file.size > 500 * 1024) { // 500KB
        const proceed = confirm(
          `UYARI: Dosya boyutu ${fileSizeMB.toFixed(2)} MB\n\n` +
          `Önerilen maksimum: 0.5 MB\n\n` +
          `Büyük dosyalar yavaş yüklenebilir.\n` +
          `Devam etmek istiyor musunuz?`
        );
        if (!proceed) {
          e.target.value = '';
          return;
        }
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Size = reader.result.length / 1024 / 1024;
        console.log(`Logo yüklendi: Orijinal ${fileSizeMB.toFixed(2)}MB, Base64: ${base64Size.toFixed(2)}MB`);
        setLogoBase64(reader.result);
      };
      reader.onerror = () => {
        alert('Dosya okuma hatası! Lütfen tekrar deneyin.');
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoBase64('');
    setLogoFile(null);
  };

  const saveSettings = async () => {
    try {
      await axios.post(`${apiUrl}/api/settings`, {
        maxDisplayItems,
        logoBase64,
        logoHeight,
        logoWidth,
        contactPhone,
        contactEmail,
        contactAddress,
        workingHours,
        workingHoursNote,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialYoutube,
        socialTiktok,
        socialWhatsapp
      });
      alert('Ayarlar kaydedildi!');
      loadData();
    } catch (error) {
      console.error('Ayar kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  // ==================== FAMILY CARDS HANDLERS ====================
  
  const openCreateFamilyModal = () => {
    setEditingFamily(null);
    setFamilyFormData({
      label: '',
      title: '',
      description: '',
      icon: 'TrendingUp',
      order: familyCards.length + 1
    });
    setShowFamilyModal(true);
  };

  const openEditFamilyModal = (card) => {
    setEditingFamily(card);
    setFamilyFormData(card);
    setShowFamilyModal(true);
  };

  const handleSaveFamily = async () => {
    try {
      if (editingFamily) {
        await axios.put(`${apiUrl}/api/family-cards/${editingFamily.id}`, familyFormData);
      } else {
        await axios.post(`${apiUrl}/api/family-cards`, familyFormData);
      }
      setShowFamilyModal(false);
      loadData();
    } catch (error) {
      console.error('Family kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteFamily = async (id) => {
    if (!confirm('Bu kartı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/family-cards/${id}`);
      loadData();
    } catch (error) {
      console.error('Family silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== ARTICLES HANDLERS ====================
  
  const openCreateArticleModal = () => {
    setEditingArticle(null);
    setArticleFormData({
      category: 'Yatırım',
      title: '',
      description: '',
      content: '',
      icon: 'Coins',
      order: articles.length + 1
    });
    setShowArticleModal(true);
  };

  const openEditArticleModal = (article) => {
    setEditingArticle(article);
    setArticleFormData(article);
    setShowArticleModal(true);
  };

  const handleSaveArticle = async () => {
    try {
      if (editingArticle) {
        await axios.put(`${apiUrl}/api/articles/${editingArticle.id}`, articleFormData);
      } else {
        await axios.post(`${apiUrl}/api/articles`, articleFormData);
      }
      setShowArticleModal(false);
      loadData();
    } catch (error) {
      console.error('Makale kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Bu makaleyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/articles/${id}`);
      loadData();
    } catch (error) {
      console.error('Makale silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== BRANCHES HANDLERS ====================

  const openCreateBranchModal = () => {
    setEditingBranch(null);
    setBranchFormData({
      name: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      workingHours: '09:00 - 18:00',
      mapLink: ''
    });
    setShowBranchModal(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingBranch(branch);
    setBranchFormData({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone || '',
      email: branch.email || '',
      workingHours: branch.workingHours || '09:00 - 18:00',
      mapLink: branch.mapLink || ''
    });
    setShowBranchModal(true);
  };

  const handleSaveBranch = async () => {
    if (!branchFormData.name || !branchFormData.city || !branchFormData.address) {
      alert('Şube adı, şehir ve adres zorunludur!');
      return;
    }

    try {
      if (editingBranch) {
        await axios.put(`${apiUrl}/api/branches/${editingBranch.id}`, branchFormData);
      } else {
        await axios.post(`${apiUrl}/api/branches`, branchFormData);
      }
      setShowBranchModal(false);
      loadData();
    } catch (error) {
      console.error('Şube kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!confirm('Bu şubeyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      await axios.delete(`${apiUrl}/api/branches/${id}`);
      loadData();
    } catch (error) {
      console.error('Şube silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  // ==================== DRAG & DROP HANDLERS ====================
  
  const handleDragStart = (e, price) => {
    setDraggedItem(price);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, price) => {
    e.preventDefault();
    setDraggedOverItem(price);
  };

  const handleDragEnd = async () => {
    if (!draggedItem || !draggedOverItem || draggedItem.id === draggedOverItem.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // Önce mevcut listeyi order'a göre sırala
    const sortedPrices = [...customPrices].sort((a, b) => (a.order || 0) - (b.order || 0));

    const draggedIndex = sortedPrices.findIndex(p => p.id === draggedItem.id);
    const targetIndex = sortedPrices.findIndex(p => p.id === draggedOverItem.id);

    // Array'den çıkar ve yeni pozisyona ekle
    const [removed] = sortedPrices.splice(draggedIndex, 1);
    sortedPrices.splice(targetIndex, 0, removed);

    // Order değerlerini güncelle (0'dan başlayarak)
    const updatedPrices = sortedPrices.map((price, index) => ({
      ...price,
      order: index
    }));

    // State'i güncelle
    setCustomPrices(updatedPrices);

    // Backend'e toplu sıralama gönder
    try {
      const orders = updatedPrices.map(price => ({
        id: price.id,
        order: price.order
      }));
      await axios.put(`${apiUrl}/api/custom-prices/reorder`, { orders });
      console.log('✅ Sıralama kaydedildi');
    } catch (error) {
      console.error('❌ Sıralama kaydetme hatası:', error);
      alert('Sıralama kaydedilemedi!');
      loadData(); // Hata durumunda yeniden yükle
    }

    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const calculatePreview = (config) => {
    const source = sourcePrices.find(p => p.code === config.sourceCode);
    if (!source) return 0;

    const rawPrice = config.sourceType === 'alis' ? source.rawAlis : source.rawSatis;
    return (rawPrice * config.multiplier) + config.addition;
  };

  // Sıra numarası değiştirme fonksiyonu
  const handleOrderChange = async (priceId, newOrder) => {
    const orderNum = parseInt(newOrder);
    if (isNaN(orderNum) || orderNum < 0) return;

    // Önce state'i güncelle
    const updatedPrices = customPrices.map(p =>
      p.id === priceId ? { ...p, order: orderNum } : p
    );
    setCustomPrices(updatedPrices);

    // Backend'e kaydet
    try {
      await axios.put(`${apiUrl}/api/custom-prices/${priceId}`, { order: orderNum });
      console.log('✅ Sıra numarası güncellendi');
    } catch (error) {
      console.error('❌ Sıra güncelleme hatası:', error);
    }
  };

  const filteredPrices = customPrices
    .filter(p => {
      if (filter !== 'all' && p.category !== filter) return false;
      return true;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Fiyat Yönetimi</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {logoBase64 ? (
                    <img 
                      src={logoBase64} 
                      alt="Logo" 
                      className="object-contain" 
                      style={{ 
                        height: `${logoHeight}px`, 
                        width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                        maxWidth: '300px'
                      }} 
                    />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <TrendingUp className="text-white" size={22} />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">Admin Paneli</h1>
                        <p className="text-xs text-gray-500">Fiyat Yönetimi</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* WebSocket Bağlantı Durumu */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs font-semibold">{isConnected ? 'Canlı' : 'Bağlantı Yok'}</span>
                </div>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  title="Ayarlar"
                >
                  <Settings size={18} />
                  <span>Ayarlar</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium"
                >
                  <LogOut size={18} />
                  <span>Çıkış</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('prices')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'prices'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp size={18} />
                  <span>Fiyat Yönetimi</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('family')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'family'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users size={18} />
                  <span>NOMANOĞLU Ailesi</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'articles'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText size={18} />
                  <span>Rehber Makaleleri</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('branches')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'branches'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building2 size={18} />
                  <span>Şubeler</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 font-semibold text-sm border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings size={18} />
                  <span>Ayarlar</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* ==================== FIYAT YÖNETİMİ TAB ==================== */}
          {activeTab === 'prices' && (
          <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Kaynak Fiyatlar</p>
                  <p className="text-3xl font-bold text-gray-900">{sourcePrices.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Oluşturulan Fiyatlar</p>
                  <p className="text-3xl font-bold text-gray-900">{customPrices.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Save className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Kategori</p>
                  <p className="text-3xl font-bold text-gray-900">{filter === 'all' ? 'Tümü' : filter === 'altin' ? 'Altın' : filter === 'doviz' ? 'Döviz' : 'Gümüş'}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className={`rounded-xl border-2 p-6 shadow-sm transition-all ${
              isConnected 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold mb-1 ${isConnected ? 'text-green-700' : 'text-orange-700'}`}>
                    Son Güncelleme
                  </p>
                  {lastUpdate ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(lastUpdate).toLocaleTimeString('tr-TR')}
                      </p>
                      <p className={`text-xs mt-1 font-semibold ${isConnected ? 'text-green-600' : 'text-orange-600'}`}>
                        {timeSinceUpdate}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Bekleniyor...</p>
                  )}
                  {!isConnected && lastUpdate && (
                    <p className="text-xs text-orange-700 mt-2 flex items-center space-x-1">
                      <AlertCircle size={12} />
                      <span>Bağlantı kesildi</span>
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isConnected ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  <RefreshCw className={`text-white ${isConnected ? 'animate-spin' : ''}`} size={24} style={{animationDuration: '3s'}} />
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'all' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tümü ({customPrices.length})
                </button>
                <button
                  onClick={() => setFilter('altin')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'altin' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Altın ({customPrices.filter(p => p.category === 'altin').length})
                </button>
                <button
                  onClick={() => setFilter('doviz')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'doviz' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Döviz ({customPrices.filter(p => p.category === 'doviz').length})
                </button>
                <button
                  onClick={() => setFilter('gumus')}
                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === 'gumus' 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Gümüş ({customPrices.filter(p => p.category === 'gumus').length})
                </button>
              </div>

              <button
                onClick={openCreateModal}
                className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm whitespace-nowrap"
              >
                <Plus size={18} />
                <span>Yeni Fiyat Oluştur</span>
              </button>
            </div>
          </div>

          {/* Bilgilendirme */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 flex items-start space-x-3 shadow-sm">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="text-white" size={20} />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 mb-2">💡 Nasıl Çalışır?</p>
              <p className="text-gray-700 mb-1">Yeni fiyat oluştur butonuna tıklayarak özel fiyatlar oluşturabilirsiniz.</p>
              <p className="text-gray-600 mb-1">API'den çekilen fiyatları kaynak olarak kullanarak kendi fiyat yapınızı oluşturun.</p>
              <p className="text-amber-600 font-semibold flex items-center space-x-1">
                <GripVertical size={16} />
                <span>Fiyatları sürükleyerek sıralayabilirsiniz!</span>
              </p>
            </div>
          </div>

          {/* Fiyat Listesi */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {filteredPrices.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <Plus size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz fiyat oluşturulmadı</p>
                  <p className="text-sm mb-4">Yeni bir fiyat oluşturarak başlayın</p>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Fiyatı Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-center px-2 py-4 text-sm font-bold text-gray-700 w-16">Sıra</th>
                      <th className="text-center px-2 py-4 text-sm font-bold text-gray-700 w-10"></th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Fiyat Bilgisi</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Alış Kaynağı</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Satış Kaynağı</th>
                      <th className="text-right px-4 py-4 text-sm font-bold text-gray-700">Hesaplanan Alış</th>
                      <th className="text-right px-4 py-4 text-sm font-bold text-gray-700">Hesaplanan Satış</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrices.map((price, index) => {
                      const alisPreview = calculatePreview(price.alisConfig);
                      const satisPreview = calculatePreview(price.satisConfig);
                      const isDragging = draggedItem?.id === price.id;
                      const isDraggedOver = draggedOverItem?.id === price.id;
                      
                      return (
                        <tr
                          key={price.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, price)}
                          onDragEnter={(e) => handleDragEnter(e, price)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`border-b border-gray-100 transition-all ${
                            isDragging
                              ? 'opacity-50 bg-blue-50'
                              : isDraggedOver
                                ? 'bg-amber-100 border-l-4 border-l-amber-500'
                                : index % 2 === 0
                                  ? 'bg-white hover:bg-amber-50'
                                  : 'bg-gray-50/50 hover:bg-amber-50'
                          }`}
                          style={{ cursor: 'grab' }}
                        >
                          <td className="px-2 py-4 text-center">
                            <input
                              type="number"
                              min="0"
                              value={price.order || 0}
                              onChange={(e) => handleOrderChange(price.id, e.target.value)}
                              className="w-14 px-1 py-1 text-center border border-gray-300 rounded text-sm font-bold text-black focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="px-2 py-4 text-center">
                            <GripVertical
                              size={18}
                              className="mx-auto text-gray-400 hover:text-gray-600 transition-colors"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{price.name}</div>
                              <div className="text-xs text-gray-500">{price.code}</div>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                price.category === 'altin' ? 'bg-amber-100 text-amber-700' :
                                price.category === 'doviz' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {price.category === 'altin' ? 'Altın' : price.category === 'doviz' ? 'Döviz' : 'Gümüş'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-700">{price.alisConfig.sourceCode}</div>
                            <div className="text-xs text-gray-500">
                              {price.alisConfig.sourceType === 'alis' ? 'Alış' : 'Satış'} × {price.alisConfig.multiplier} + {price.alisConfig.addition}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-700">{price.satisConfig.sourceCode}</div>
                            <div className="text-xs text-gray-500">
                              {price.satisConfig.sourceType === 'alis' ? 'Alış' : 'Satış'} × {price.satisConfig.multiplier} + {price.satisConfig.addition}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-green-700 font-mono font-bold text-lg">₺{alisPreview.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-red-700 font-mono font-bold text-lg">₺{satisPreview.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => openEditModal(price)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(price.id)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                title="Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== NOMANOĞLU AİLESİ TAB ==================== */}
          {activeTab === 'family' && (
          <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">NOMANOĞLU Ailesi Kartları</h2>
              <p className="text-gray-600 mt-1">Anasayfada görünecek kurumsal kartları yönetin</p>
            </div>
            <button
              onClick={openCreateFamilyModal}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Kart Ekle</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {familyCards.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz kart eklenmedi</p>
                  <p className="text-sm mb-4">İlk kartı oluşturarak başlayın</p>
                  <button
                    onClick={openCreateFamilyModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Kartı Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Etiket</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Başlık</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Açıklama</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İkon</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Sıra</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyCards.map((card, index) => (
                      <tr key={card.id} className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">{card.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{card.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{card.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-lg">
                            {card.icon === 'TrendingUp' && <TrendingUp size={16} />}
                            {card.icon === 'CheckCircle' && <AlertCircle size={16} />}
                            {card.icon === 'Star' && <Plus size={16} />}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-semibold text-gray-700">{card.order}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditFamilyModal(card)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFamily(card.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== REHBER MAKALELERİ TAB ==================== */}
          {activeTab === 'articles' && (
          <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bilgi & Rehber Makaleleri</h2>
              <p className="text-gray-600 mt-1">Anasayfada görünecek içerik makalelerini yönetin</p>
            </div>
            <button
              onClick={openCreateArticleModal}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
            >
              <Plus size={18} />
              <span>Yeni Makale Ekle</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {articles.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Henüz makale eklenmedi</p>
                  <p className="text-sm mb-4">İlk makaleyi oluşturarak başlayın</p>
                  <button
                    onClick={openCreateArticleModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    <Plus size={18} />
                    <span>İlk Makaleyi Oluştur</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Kategori</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Başlık</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Açıklama</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İkon</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">Sıra</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article, index) => (
                      <tr key={article.id} className={`border-b border-gray-100 hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{article.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{article.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{article.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-lg">
                            {article.icon === 'Coins' && <TrendingUp size={16} />}
                            {article.icon === 'Gem' && <AlertCircle size={16} />}
                            {article.icon === 'TrendingUp' && <TrendingUp size={16} />}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-semibold text-gray-700">{article.order}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditArticleModal(article)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
          )}

          {/* ==================== ŞUBELER TAB ==================== */}
          {activeTab === 'branches' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Şube Yönetimi</h2>
                <p className="text-gray-600 mt-1">Tüm şubelerinizi buradan yönetin</p>
              </div>
              <button
                onClick={openCreateBranchModal}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Plus size={20} />
                <span>Yeni Şube Ekle</span>
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Henüz Şube Eklenmedi</h3>
                <p className="text-gray-600 mb-4">İletişim sayfasında görünmesi için şube ekleyin</p>
                <button
                  onClick={openCreateBranchModal}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <Plus size={20} />
                  <span>İlk Şubeyi Ekle</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Şube Adı</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Şehir</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Adres</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">İletişim</th>
                      <th className="text-center px-4 py-4 text-sm font-bold text-gray-700">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch, index) => (
                      <tr 
                        key={branch.id}
                        className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{branch.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {branch.city}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs truncate">{branch.address}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {branch.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Phone size={14} />
                                <span>{branch.phone}</span>
                              </div>
                            )}
                            {branch.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <Mail size={14} />
                                <span>{branch.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditBranchModal(branch)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
          )}

          {/* ==================== AYARLAR TAB ==================== */}
          {activeTab === 'settings' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ayarlar</h2>
                <p className="text-gray-600 mt-1">Genel site ayarlarını buradan yönetin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Logo Ayarları */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings size={20} />
                  <span>Logo Ayarları</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Anasayfa header'ında görünecek logoyu yükleyin (Önerilen: 500KB)
                </p>

                {logoBase64 ? (
                  <div className="space-y-4">
                    <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-center h-32 bg-white rounded-lg">
                        <img
                          src={logoBase64}
                          alt="Logo"
                          className="object-contain"
                          style={{
                            height: `${logoHeight}px`,
                            width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                            maxHeight: '112px',
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <div className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-center border border-blue-200">
                          Değiştir
                        </div>
                      </label>
                      <button
                        onClick={removeLogo}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Logo Boyut Ayarları */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Logo Boyutu
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Yükseklik */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Yükseklik (px)</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min="24"
                              max="120"
                              value={logoHeight}
                              onChange={(e) => setLogoHeight(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <input
                              type="number"
                              min="24"
                              max="120"
                              value={logoHeight}
                              onChange={(e) => setLogoHeight(parseInt(e.target.value) || 48)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Genişlik */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">Genişlik</label>
                          <div className="flex items-center space-x-2">
                            <select
                              value={logoWidth === 'auto' ? 'auto' : 'custom'}
                              onChange={(e) => {
                                if (e.target.value === 'auto') {
                                  setLogoWidth('auto');
                                } else {
                                  setLogoWidth(200);
                                }
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            >
                              <option value="auto">Otomatik</option>
                              <option value="custom">Özel</option>
                            </select>
                            {logoWidth !== 'auto' && (
                              <input
                                type="number"
                                min="50"
                                max="400"
                                value={logoWidth}
                                onChange={(e) => setLogoWidth(parseInt(e.target.value) || 200)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-semibold text-gray-900 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                        <AlertCircle size={14} />
                        <span>
                          Mevcut: {logoHeight}px × {logoWidth === 'auto' ? 'Otomatik' : `${logoWidth}px`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-amber-500 hover:bg-amber-50 transition-all">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Plus size={32} className="text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700">Logo Yükle</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (Önerilen: maks 500KB)</p>
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* Diğer Ayarlar */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp size={20} />
                  <span>Görüntüleme Ayarları</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maksimum Görüntülenecek Ürün Sayısı
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Anasayfada en fazla kaç fiyat gösterilsin? (TV ekranları için)
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxDisplayItems}
                      onChange={(e) => setMaxDisplayItems(parseInt(e.target.value) || 20)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-900 text-center text-2xl font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone size={20} />
                  <span>İletişim Bilgileri</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+90 (XXX) XXX XX XX"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@example.com"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <input
                      type="text"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      placeholder="Istanbul, Turkiye"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calisma Saatleri</label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="Pzt - Cmt: 09:00 - 19:00"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calisma Saatleri Notu</label>
                    <input
                      type="text"
                      value={workingHoursNote}
                      onChange={(e) => setWorkingHoursNote(e.target.value)}
                      placeholder="Pazar: Kapali"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Sosyal Medya */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mail size={20} />
                  <span>Sosyal Medya</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Numarasi</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">+</span>
                      <input
                        type="text"
                        value={socialWhatsapp}
                        onChange={(e) => setSocialWhatsapp(e.target.value)}
                        placeholder="905XXXXXXXXX"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Ulke kodu ile birlikte (ornek: 905322904601)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                    <input
                      type="url"
                      value={socialFacebook}
                      onChange={(e) => setSocialFacebook(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
                    <input
                      type="url"
                      value={socialTwitter}
                      onChange={(e) => setSocialTwitter(e.target.value)}
                      placeholder="https://twitter.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                    <input
                      type="url"
                      value={socialInstagram}
                      onChange={(e) => setSocialInstagram(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Youtube URL</label>
                    <input
                      type="url"
                      value={socialYoutube}
                      onChange={(e) => setSocialYoutube(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok URL</label>
                    <input
                      type="url"
                      value={socialTiktok}
                      onChange={(e) => setSocialTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@..."
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kaydet Butonu */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
              >
                <Save size={20} />
                <span>Ayarları Kaydet</span>
              </button>
            </div>
          </>
          )}
        </main>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPrice ? 'Fiyat Düzenle' : 'Yeni Fiyat Oluştur'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Genel Bilgiler */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Genel Bilgiler</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat Adı *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="örn: VIP Dolar"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kod *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        placeholder="örn: VIP_USD"
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                      >
                        <option value="doviz">Döviz</option>
                        <option value="altin">Altın</option>
                        <option value="gumus">Gümüş</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Alış Fiyatı Yapılandırması */}
                <div className="bg-green-50 rounded-xl p-5 space-y-4 border-2 border-green-200">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
                    <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">A</span>
                    <span>Alış Fiyatı Yapılandırması</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kaynak Fiyat</label>
                      <select
                        value={formData.alisConfig.sourceCode}
                        onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, sourceCode: e.target.value}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                      >
                        {sourcePrices.map(p => (
                          <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hangi Fiyat Kullanılsın?</label>
                      <select
                        value={formData.alisConfig.sourceType}
                        onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, sourceType: e.target.value}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                      >
                        <option value="alis">Alış Fiyatı</option>
                        <option value="satis">Satış Fiyatı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Katsayı (×)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.alisConfig.multiplier}
                        onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, multiplier: parseFloat(e.target.value) || 1}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ekleme (+)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.alisConfig.addition}
                        onChange={(e) => setFormData({...formData, alisConfig: {...formData.alisConfig, addition: parseFloat(e.target.value) || 0}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <p className="text-sm text-gray-600 mb-1">Önizleme:</p>
                    <p className="text-3xl font-bold text-green-700">₺{calculatePreview(formData.alisConfig).toFixed(2)}</p>
                  </div>
                </div>

                {/* Satış Fiyatı Yapılandırması */}
                <div className="bg-red-50 rounded-xl p-5 space-y-4 border-2 border-red-200">
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
                    <span className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">S</span>
                    <span>Satış Fiyatı Yapılandırması</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kaynak Fiyat</label>
                      <select
                        value={formData.satisConfig.sourceCode}
                        onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, sourceCode: e.target.value}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      >
                        {sourcePrices.map(p => (
                          <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hangi Fiyat Kullanılsın?</label>
                      <select
                        value={formData.satisConfig.sourceType}
                        onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, sourceType: e.target.value}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      >
                        <option value="alis">Alış Fiyatı</option>
                        <option value="satis">Satış Fiyatı</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Katsayı (×)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.satisConfig.multiplier}
                        onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, multiplier: parseFloat(e.target.value) || 1}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ekleme (+)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.satisConfig.addition}
                        onChange={(e) => setFormData({...formData, satisConfig: {...formData.satisConfig, addition: parseFloat(e.target.value) || 0}})}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-red-300">
                    <p className="text-sm text-gray-600 mb-1">Önizleme:</p>
                    <p className="text-3xl font-bold text-red-700">₺{calculatePreview(formData.satisConfig).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.code}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingPrice ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Family Modal */}
        {showFamilyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingFamily ? 'Kartı Düzenle' : 'Yeni Kart Oluştur'}
                </h2>
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etiket (Üstteki küçük yazı)</label>
                  <input
                    type="text"
                    value={familyFormData.label}
                    onChange={(e) => setFamilyFormData({...familyFormData, label: e.target.value})}
                    placeholder="örn: 1967'den Beri"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={familyFormData.title}
                    onChange={(e) => setFamilyFormData({...familyFormData, title: e.target.value})}
                    placeholder="örn: Yarım asırlık deneyim."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                  <textarea
                    value={familyFormData.description}
                    onChange={(e) => setFamilyFormData({...familyFormData, description: e.target.value})}
                    placeholder="Kısa açıklama..."
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                    <select
                      value={familyFormData.icon}
                      onChange={(e) => setFamilyFormData({...familyFormData, icon: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    >
                      <option value="TrendingUp">Yükseliş Ok</option>
                      <option value="CheckCircle">Check İşareti</option>
                      <option value="Star">Yıldız</option>
                      <option value="Coins">Para</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sıra</label>
                    <input
                      type="number"
                      value={familyFormData.order}
                      onChange={(e) => setFamilyFormData({...familyFormData, order: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowFamilyModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveFamily}
                  disabled={!familyFormData.title}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingFamily ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Article Modal */}
        {showArticleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingArticle ? 'Makaleyi Düzenle' : 'Yeni Makale Oluştur'}
                </h2>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={articleFormData.category}
                    onChange={(e) => setArticleFormData({...articleFormData, category: e.target.value})}
                    placeholder="örn: Yatırım, Karşılaştırma, Piyasa"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık *</label>
                  <input
                    type="text"
                    value={articleFormData.title}
                    onChange={(e) => setArticleFormData({...articleFormData, title: e.target.value})}
                    placeholder="örn: Altın Yatırımı Rehberi"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kısa Açıklama (Özet)</label>
                  <textarea
                    value={articleFormData.description}
                    onChange={(e) => setArticleFormData({...articleFormData, description: e.target.value})}
                    placeholder="Anasayfada görünecek kısa açıklama..."
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tam İçerik (Makale Detayı)</label>
                  <textarea
                    value={articleFormData.content}
                    onChange={(e) => setArticleFormData({...articleFormData, content: e.target.value})}
                    placeholder="Makalenin tam içeriğini buraya yazın... (Markdown destekler: **kalın**, *italik*, ### Başlık)"
                    rows={10}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 Paragraf ayırmak için iki satır boşluk bırakın</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İkon</label>
                    <select
                      value={articleFormData.icon}
                      onChange={(e) => setArticleFormData({...articleFormData, icon: e.target.value})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    >
                      <option value="Coins">Para</option>
                      <option value="Gem">Mücevher</option>
                      <option value="TrendingUp">Yükseliş</option>
                      <option value="CheckCircle">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sıra</label>
                    <input
                      type="number"
                      value={articleFormData.order}
                      onChange={(e) => setArticleFormData({...articleFormData, order: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveArticle}
                  disabled={!articleFormData.title}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingArticle ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Branch Modal */}
        {showBranchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBranch ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
                </h2>
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şube Adı *</label>
                    <input
                      type="text"
                      value={branchFormData.name}
                      onChange={(e) => setBranchFormData({...branchFormData, name: e.target.value})}
                      placeholder="örn: Kadirli Şubesi"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
                    <input
                      type="text"
                      value={branchFormData.city}
                      onChange={(e) => setBranchFormData({...branchFormData, city: e.target.value})}
                      placeholder="örn: Osmaniye"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adres *</label>
                  <textarea
                    value={branchFormData.address}
                    onChange={(e) => setBranchFormData({...branchFormData, address: e.target.value})}
                    placeholder="Tam adres..."
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={branchFormData.phone}
                      onChange={(e) => setBranchFormData({...branchFormData, phone: e.target.value})}
                      placeholder="örn: 0850 XXX XX XX"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <input
                      type="email"
                      value={branchFormData.email}
                      onChange={(e) => setBranchFormData({...branchFormData, email: e.target.value})}
                      placeholder="örn: kadirli@nomanoglu.com"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çalışma Saatleri</label>
                  <input
                    type="text"
                    value={branchFormData.workingHours}
                    onChange={(e) => setBranchFormData({...branchFormData, workingHours: e.target.value})}
                    placeholder="örn: 09:00 - 18:00"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Harita Linki (Google Maps)</label>
                  <input
                    type="url"
                    value={branchFormData.mapLink}
                    onChange={(e) => setBranchFormData({...branchFormData, mapLink: e.target.value})}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Google Maps'ten paylaş linkini yapıştırın</p>
                </div>
              </div>

              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveBranch}
                  disabled={!branchFormData.name || !branchFormData.city || !branchFormData.address}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingBranch ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
