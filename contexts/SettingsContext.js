import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Logo'yu sadece bir kez yükle
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogoBase64(data.data.logoBase64 || '');
          setLogoHeight(data.data.logoHeight || 48);
          setLogoWidth(data.data.logoWidth || 'auto');
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Logo yükleme hatası:', err);
        setIsLoaded(true);
      });
  }, []);

  return (
    <SettingsContext.Provider value={{ logoBase64, logoHeight, logoWidth, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
