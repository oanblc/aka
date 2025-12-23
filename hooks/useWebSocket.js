import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const CACHE_KEY = 'cachedPrices';
const CACHE_TIME_KEY = 'cachedPricesTime';
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika (uzatıldı)

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const previousPricesRef = useRef([]);
  const initialLoadDone = useRef(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

  // Database'den fiyatları çek
  const fetchPricesFromDB = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/prices/cached`);
      const data = await response.json();

      if (data.success && data.data && data.data.prices && data.data.prices.length > 0) {
        const sortedPrices = [...data.data.prices].sort((a, b) => (a.order || 0) - (b.order || 0));
        return sortedPrices;
      }
    } catch (err) {
      console.log('API cache erişilemedi:', err.message);
    }
    return null;
  };

  // LocalStorage'dan fiyatları yükle
  const loadFromLocalStorage = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

      if (cached && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        if (timeDiff < CACHE_DURATION) {
          const cachedPrices = JSON.parse(cached);
          if (cachedPrices && cachedPrices.length > 0) {
            return cachedPrices;
          }
        }
      }
    } catch (err) {
      console.error('LocalStorage okuma hatası:', err);
    }
    return null;
  };

  // LocalStorage'a kaydet
  const saveToLocalStorage = (priceData) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(priceData));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (err) {
      console.error('LocalStorage yazma hatası:', err);
    }
  };

  // Fiyatları güncelle (boşaltma!)
  const updatePrices = (newPrices) => {
    if (newPrices && newPrices.length > 0) {
      const sortedPrices = [...newPrices].sort((a, b) => (a.order || 0) - (b.order || 0));
      setPrices(sortedPrices);
      previousPricesRef.current = sortedPrices;
      saveToLocalStorage(sortedPrices);
      return true;
    }
    return false;
  };

  // Sayfa yüklendiğinde önce localStorage, sonra API'den fiyatları yükle
  useEffect(() => {
    const loadInitialPrices = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      // 1. Önce localStorage'dan hemen yükle (anında göster)
      const localPrices = loadFromLocalStorage();
      if (localPrices) {
        setPrices(localPrices);
        previousPricesRef.current = localPrices;
        console.log('📦 LocalStorage\'dan fiyatlar yüklendi:', localPrices.length);
      }

      // 2. Arka planda API'den güncel fiyatları çek
      const dbPrices = await fetchPricesFromDB();
      if (dbPrices) {
        updatePrices(dbPrices);
        setLastUpdate(new Date());
        console.log('🌐 Database\'den fiyatlar yüklendi:', dbPrices.length);
      }
    };

    loadInitialPrices();
  }, []);

  // WebSocket bağlantısı
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket bağlantısı kuruldu');
      setIsConnected(true);
    });

    newSocket.on('disconnect', async () => {
      console.log('❌ WebSocket bağlantısı kesildi');
      setIsConnected(false);

      // Bağlantı kesildiğinde mevcut fiyatları KORU - boşaltma!
      // previousPricesRef zaten mevcut fiyatları tutuyor
      if (previousPricesRef.current.length > 0) {
        console.log('💾 Önceki fiyatlar korunuyor:', previousPricesRef.current.length);
      }
    });

    newSocket.on('priceUpdate', (data) => {
      // Veri kontrolü - boş veya geçersiz veri gelirse önceki fiyatları koru
      if (!data || !data.prices || !Array.isArray(data.prices)) {
        console.log('⚠️ Geçersiz veri formatı, önceki fiyatlar korunuyor');
        return;
      }

      const visiblePrices = data.prices.filter(p => p.isVisible);

      // Sadece geçerli veri varsa güncelle
      if (visiblePrices.length > 0) {
        updatePrices(visiblePrices);
        setLastUpdate(data.meta?.time || Date.now());
        console.log('📡 WebSocket\'ten fiyatlar güncellendi:', visiblePrices.length);
      }
      // Boş veri gelirse hiçbir şey yapma - mevcut fiyatları koru
    });

    newSocket.on('connect_error', async (error) => {
      console.error('WebSocket bağlantı hatası:', error);

      // Hata durumunda API'den fiyat çekmeyi dene
      if (previousPricesRef.current.length === 0) {
        const dbPrices = await fetchPricesFromDB();
        if (dbPrices) {
          updatePrices(dbPrices);
          console.log('🔄 Bağlantı hatası - Database\'den fiyatlar yüklendi');
        }
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Periyodik olarak database'den fiyatları kontrol et (her 30 saniye)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!isConnected && previousPricesRef.current.length === 0) {
        console.log('🔄 Bağlantı yok, database\'den fiyat kontrolü...');
        const dbPrices = await fetchPricesFromDB();
        if (dbPrices) {
          updatePrices(dbPrices);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return { socket, prices, isConnected, lastUpdate };
};
