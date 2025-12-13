import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const CACHE_KEY = 'cachedPrices';
const CACHE_TIME_KEY = 'cachedPricesTime';
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [prices, setPrices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const previousPricesRef = useRef([]);
  const initialLoadDone = useRef(false);

  // Sayfa yüklendiğinde önce API'den, sonra localStorage'dan fiyatları yükle
  useEffect(() => {
    const loadInitialPrices = async () => {
      if (initialLoadDone.current) return;
      initialLoadDone.current = true;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      try {
        // Önce API'den cache'li fiyatları çek
        const response = await fetch(`${apiUrl}/api/prices/cached`);
        const data = await response.json();

        if (data.success && data.data && data.data.prices && data.data.prices.length > 0) {
          const sortedPrices = [...data.data.prices].sort((a, b) => (a.order || 0) - (b.order || 0));
          setPrices(sortedPrices);
          previousPricesRef.current = sortedPrices;
          setLastUpdate(data.data.meta?.time || data.updatedAt);
          console.log('🌐 API\'den fiyatlar yüklendi:', sortedPrices.length);

          // LocalStorage'a da kaydet
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
          return;
        }
      } catch (err) {
        console.log('API cache erişilemedi, localStorage denenecek:', err.message);
      }

      // API'den alınamazsa localStorage'dan dene
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cached && cachedTime) {
          const timeDiff = Date.now() - parseInt(cachedTime);
          if (timeDiff < CACHE_DURATION) {
            const cachedPrices = JSON.parse(cached);
            if (cachedPrices && cachedPrices.length > 0) {
              const sortedPrices = [...cachedPrices].sort((a, b) => (a.order || 0) - (b.order || 0));
              setPrices(sortedPrices);
              previousPricesRef.current = sortedPrices;
              console.log('📦 LocalStorage\'dan fiyatlar yüklendi:', sortedPrices.length);
            }
          }
        }
      } catch (err) {
        console.error('LocalStorage okuma hatası:', err);
      }
    };

    loadInitialPrices();
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Sürekli dene
      reconnectionDelayMax: 5000
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket bağlantısı kuruldu');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket bağlantısı kesildi');
      setIsConnected(false);
      // Bağlantı kesildiğinde önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
    });

    newSocket.on('priceUpdate', (data) => {
      // Veri kontrolü - boş veya geçersiz veri gelirse önceki fiyatları koru
      if (!data || !data.prices || !Array.isArray(data.prices)) {
        console.log('⚠️ Geçersiz veri formatı, önceki fiyatlar korunuyor');
        // Önceki fiyatları koru, state'i boşaltma
        return;
      }

      const visiblePrices = data.prices.filter(p => p.isVisible);

      // Sadece geçerli veri varsa güncelle
      if (visiblePrices.length > 0) {
        // Order'a gore sirala
        const sortedPrices = [...visiblePrices].sort((a, b) => (a.order || 0) - (b.order || 0));

        setPrices(sortedPrices);
        previousPricesRef.current = sortedPrices;
        setLastUpdate(data.meta?.time || Date.now());

        // Cache'e kaydet (siralanmis hali)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(sortedPrices));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (err) {
          console.error('Cache yazma hatası:', err);
        }
      }
      // Boş veri gelirse hiçbir şey yapma - mevcut fiyatları koru
      // setPrices çağırma, böylece tablo boşalmaz
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket bağlantı hatası:', error);
      // Hata durumunda önceki fiyatları koru
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, prices, isConnected, lastUpdate };
};

