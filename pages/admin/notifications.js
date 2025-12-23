import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { Bell, Send, Plus, Edit2, Trash2, X, Save, ArrowLeft, Smartphone, Megaphone, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, draft: 0, deviceCount: 0, lastWeekSent: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'announcement',
    imageUrl: '',
    actionUrl: '',
    targetAudience: 'all'
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  const notificationTypes = [
    { value: 'campaign', label: 'Kampanya', icon: Megaphone, color: 'text-orange-600 bg-orange-100' },
    { value: 'announcement', label: 'Duyuru', icon: Bell, color: 'text-blue-600 bg-blue-100' },
    { value: 'price_alert', label: 'Fiyat Uyarısı', icon: AlertCircle, color: 'text-green-600 bg-green-100' },
    { value: 'news', label: 'Haber', icon: Megaphone, color: 'text-purple-600 bg-purple-100' }
  ];

  const audienceOptions = [
    { value: 'all', label: 'Tüm Cihazlar' },
    { value: 'ios', label: 'Sadece iOS' },
    { value: 'android', label: 'Sadece Android' },
    { value: 'web', label: 'Sadece Web' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifRes, statsRes] = await Promise.all([
        axios.get(`${apiUrl}/api/notifications`),
        axios.get(`${apiUrl}/api/notifications/stats/summary`)
      ]);

      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNotification(null);
    setFormData({
      title: '',
      body: '',
      type: 'announcement',
      imageUrl: '',
      actionUrl: '',
      targetAudience: 'all'
    });
    setShowModal(true);
  };

  const openEditModal = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      body: notification.body,
      type: notification.type,
      imageUrl: notification.imageUrl || '',
      actionUrl: notification.actionUrl || '',
      targetAudience: notification.targetAudience
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingNotification) {
        await axios.put(`${apiUrl}/api/notifications/${editingNotification._id}`, formData);
      } else {
        await axios.post(`${apiUrl}/api/notifications`, formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme başarısız!');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${apiUrl}/api/notifications/${id}`);
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme başarısız!');
    }
  };

  const handleSend = async (id) => {
    if (!confirm('Bu bildirimi tüm kullanıcılara göndermek istediğinizden emin misiniz?')) return;

    setSending(true);
    try {
      const response = await axios.post(`${apiUrl}/api/notifications/${id}/send`);
      if (response.data.success) {
        alert(response.data.message);
        loadData();
      }
    } catch (error) {
      console.error('Gönderme hatası:', error);
      alert(error.response?.data?.message || 'Gönderme başarısız!');
    } finally {
      setSending(false);
    }
  };

  const getTypeInfo = (type) => {
    return notificationTypes.find(t => t.value === type) || notificationTypes[1];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Bildirimler - Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Dashboard</span>
                </Link>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center space-x-2">
                  <Bell className="text-blue-600" size={24} />
                  <h1 className="text-xl font-bold text-gray-900">Bildirim Yönetimi</h1>
                </div>
              </div>
              <button
                onClick={openCreateModal}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={18} />
                <span>Yeni Bildirim</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Toplam Bildirim</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                  <p className="text-xs text-gray-500">Gönderilen</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                  <p className="text-xs text-gray-500">Taslak</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.deviceCount}</p>
                  <p className="text-xs text-gray-500">Kayıtlı Cihaz</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Send className="text-indigo-600" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.lastWeekSent}</p>
                  <p className="text-xs text-gray-500">Bu Hafta</p>
                </div>
              </div>
            </div>
          </div>

          {/* FCM Bilgilendirme */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900">Firebase Cloud Messaging (FCM) Entegrasyonu</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Mobil uygulama hazır olduğunda, Firebase projenizi oluşturup backend'e FCM credentials ekleyerek
                  gerçek push bildirimleri gönderebilirsiniz. Şu an bildirimler veritabanına kaydedilmektedir.
                </p>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Bildirimler</h2>
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Bell size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Henüz bildirim oluşturulmamış</p>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  İlk Bildirimi Oluştur
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const typeInfo = getTypeInfo(notification.type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div
                      key={notification._id}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                            <TypeIcon size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                notification.status === 'sent'
                                  ? 'bg-green-100 text-green-700'
                                  : notification.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {notification.status === 'sent' ? 'Gönderildi' :
                                 notification.status === 'draft' ? 'Taslak' : notification.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.body}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <span>Oluşturulma: {formatDate(notification.createdAt)}</span>
                              {notification.sentAt && (
                                <span>Gönderilme: {formatDate(notification.sentAt)}</span>
                              )}
                              {notification.sentCount > 0 && (
                                <span className="text-green-600">{notification.sentCount} cihaza gönderildi</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {notification.status === 'draft' && (
                            <>
                              <button
                                onClick={() => handleSend(notification._id)}
                                disabled={sending}
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                title="Gönder"
                              >
                                <Send size={18} />
                              </button>
                              <button
                                onClick={() => openEditModal(notification)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                title="Düzenle"
                              >
                                <Edit2 size={18} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingNotification ? 'Bildirimi Düzenle' : 'Yeni Bildirim Oluştur'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Bildirim başlığı"
                    maxLength={100}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.title.length}/100</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İçerik <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Bildirim içeriği"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.body.length}/500</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kitle</label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      {audienceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görsel URL (Opsiyonel)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tıklanınca Açılacak URL (Opsiyonel)
                  </label>
                  <input
                    type="url"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
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
                  onClick={handleSave}
                  disabled={!formData.title || !formData.body}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-semibold"
                >
                  <Save size={18} />
                  <span>{editingNotification ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
