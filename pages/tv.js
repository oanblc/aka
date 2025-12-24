import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useWebSocket } from '../hooks/useWebSocket';
import { useSettings } from '../contexts/SettingsContext';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';

export default function TVMode() {
  const { prices: websocketPrices, isConnected } = useWebSocket();
  const {
    logoBase64, logoHeight, logoWidth, faviconBase64,
    contactPhone, socialWhatsapp
  } = useSettings();
  const [prices, setPrices] = useState([]);
  const previousPricesRef = useRef([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [priceChanges, setPriceChanges] = useState({});
  const [scale, setScale] = useState(1);
  const [currentTime, setCurrentTime] = useState(null);
  const [mounted, setMounted] = useState(false);

  // İstemci tarafında mount olduktan sonra saati başlat
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket'ten gelen fiyatları güncelle
  useEffect(() => {
    if (!websocketPrices || !Array.isArray(websocketPrices) || websocketPrices.length === 0) {
      if (previousPricesRef.current.length > 0 && prices.length === 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    const customPrices = websocketPrices.filter(p => p.isCustom === true);

    if (customPrices.length === 0) {
      if (previousPricesRef.current.length > 0) {
        setPrices(previousPricesRef.current);
      }
      return;
    }

    // Fiyat değişikliklerini kontrol et
    const newChanges = {};
    customPrices.forEach(newPrice => {
      const oldPrice = previousPricesRef.current.find(p => p.code === newPrice.code);
      if (oldPrice) {
        if (newPrice.calculatedAlis > oldPrice.calculatedAlis || newPrice.calculatedSatis > oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'up';
        } else if (newPrice.calculatedAlis < oldPrice.calculatedAlis || newPrice.calculatedSatis < oldPrice.calculatedSatis) {
          newChanges[newPrice.code] = 'down';
        }
      }
    });

    if (Object.keys(newChanges).length > 0) {
      setPriceChanges(prev => ({ ...prev, ...newChanges }));
      setTimeout(() => {
        setPriceChanges(prev => {
          const updated = { ...prev };
          Object.keys(newChanges).forEach(key => delete updated[key]);
          return updated;
        });
      }, 3000);
    }

    setPrices(customPrices);
    previousPricesRef.current = customPrices;
    setLastUpdate(new Date());
  }, [websocketPrices]);

  // Ekran boyutuna göre ölçek hesapla
  useEffect(() => {
    const calculateScale = () => {
      const priceCount = prices.length;
      if (priceCount === 0) return;

      const screenHeight = window.innerHeight;
      const headerHeight = 80; // Başlık yüksekliği
      const tableHeaderHeight = 50; // Tablo başlık yüksekliği
      const availableHeight = screenHeight - headerHeight - tableHeaderHeight;

      // Tüm satırların sığması için gereken satır yüksekliği
      const idealRowHeight = availableHeight / priceCount;

      // Ölçeği hesapla (1 = normal 50px satır yüksekliği baz alınarak)
      const newScale = Math.max(0.6, Math.min(2.5, idealRowHeight / 50));
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [prices.length]);

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const sortedPrices = [...prices].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <Head>
        <title>AKA Kuyumculuk - Canlı Fiyatlar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minWidth: '800px' }}>
        {/* Header - Ana siteyle aynı gradient */}
        <header
          className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg"
          style={{ padding: `${16 * scale}px ${32 * scale}px` }}
        >
          <div className="flex items-center justify-between">
            {/* Sol: Logo */}
            <div className="flex items-center" style={{ gap: `${16 * scale}px` }}>
              {logoBase64 && (
                <img
                  src={logoBase64}
                  alt="AKA Kuyumculuk"
                  className="object-contain brightness-0 invert"
                  style={{ height: `${Math.min(logoHeight || 56, 56) * scale}px` }}
                />
              )}
            </div>

            {/* Sağ: Durum ve Saat */}
            <div className="flex items-center" style={{ gap: `${24 * scale}px` }}>
              {/* Bağlantı Durumu */}
              <div
                className={`flex items-center rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                style={{ gap: `${8 * scale}px`, padding: `${6 * scale}px ${12 * scale}px` }}
              >
                {isConnected ? (
                  <Wifi size={16 * scale} className="text-green-300" />
                ) : (
                  <WifiOff size={16 * scale} className="text-red-300" />
                )}
                <span
                  className={`font-medium ${isConnected ? 'text-green-200' : 'text-red-200'}`}
                  style={{ fontSize: `${13 * scale}px` }}
                >
                  {isConnected ? 'Canlı' : 'Bağlantı Yok'}
                </span>
              </div>

              {/* Saat */}
              <div className="flex flex-col items-end">
                <span
                  className="font-bold text-white tabular-nums"
                  style={{ fontSize: `${24 * scale}px`, lineHeight: 1.1 }}
                >
                  {mounted && currentTime ? currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                </span>
                <span
                  className="text-blue-200"
                  style={{ fontSize: `${12 * scale}px` }}
                >
                  {mounted && currentTime ? currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Table Header */}
        <div
          className="flex-shrink-0 flex bg-white border-b-2 border-gray-200 shadow-sm"
          style={{ padding: `${14 * scale}px ${32 * scale}px` }}
        >
          <div
            className="font-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: `${13 * scale}px`, width: '40%', minWidth: '200px' }}
          >
            Ürün
          </div>
          <div
            className="text-right font-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: `${13 * scale}px`, width: '25%', minWidth: '120px' }}
          >
            Alış
          </div>
          <div
            className="text-right font-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: `${13 * scale}px`, width: '25%', minWidth: '120px' }}
          >
            Satış
          </div>
          <div
            className="text-right font-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: `${13 * scale}px`, width: '10%', minWidth: '60px' }}
          >
            Saat
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 flex flex-col bg-white">
          {sortedPrices.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"
                  style={{ width: `${48 * scale}px`, height: `${48 * scale}px`, marginBottom: `${16 * scale}px` }}
                />
                <p className="text-gray-500" style={{ fontSize: `${16 * scale}px` }}>
                  Fiyatlar yükleniyor...
                </p>
              </div>
            </div>
          ) : (
            sortedPrices.map((price, index) => {
              const change = priceChanges[price.code];
              const isUp = change === 'up';
              const isDown = change === 'down';
              const isEvenRow = index % 2 === 0;

              return (
                <div
                  key={price.code}
                  className={`flex-1 flex items-center transition-all duration-500 ${
                    isUp ? 'bg-green-50' : isDown ? 'bg-red-50' : isEvenRow ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                  style={{ padding: `0 ${32 * scale}px` }}
                >
                  {/* Product */}
                  <div style={{ width: '40%', minWidth: '200px' }}>
                    <p
                      className="font-semibold text-gray-900 truncate"
                      style={{ fontSize: `${18 * scale}px` }}
                    >
                      {price.name}
                    </p>
                  </div>

                  {/* Buy Price */}
                  <div className="text-right" style={{ width: '25%', minWidth: '120px' }}>
                    <div className="flex items-center justify-end" style={{ gap: `${6 * scale}px` }}>
                      {isUp && <TrendingUp size={18 * scale} className="text-green-600 flex-shrink-0" />}
                      {isDown && <TrendingDown size={18 * scale} className="text-red-600 flex-shrink-0" />}
                      <span
                        className={`font-bold tabular-nums whitespace-nowrap ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'}`}
                        style={{ fontSize: `${20 * scale}px` }}
                      >
                        {formatPrice(price.calculatedAlis)}
                      </span>
                    </div>
                  </div>

                  {/* Sell Price */}
                  <div className="text-right" style={{ width: '25%', minWidth: '120px' }}>
                    <div className="flex items-center justify-end" style={{ gap: `${6 * scale}px` }}>
                      {isUp && <TrendingUp size={18 * scale} className="text-green-600 flex-shrink-0" />}
                      {isDown && <TrendingDown size={18 * scale} className="text-red-600 flex-shrink-0" />}
                      <span
                        className={`font-bold tabular-nums whitespace-nowrap ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-gray-900'}`}
                        style={{ fontSize: `${20 * scale}px` }}
                      >
                        {formatPrice(price.calculatedSatis)}
                      </span>
                    </div>
                  </div>

                  {/* Update Time */}
                  <div className="text-right" style={{ width: '10%', minWidth: '60px' }}>
                    <span
                      className="text-gray-500 tabular-nums font-medium whitespace-nowrap"
                      style={{ fontSize: `${14 * scale}px` }}
                    >
                      {lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        html, body {
          overflow: hidden;
        }

        /* Hide scrollbar */
        ::-webkit-scrollbar {
          display: none;
        }

        /* Smooth color transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
