import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSettings } from '../../contexts/SettingsContext';
import { ArrowLeft, Calendar, Tag, Share2, TrendingUp, Coins, Gem, CheckCircle, Star, DollarSign, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const {
    logoBase64, logoHeight, logoWidth,
    contactPhone, contactEmail,
    socialFacebook, socialTwitter, socialInstagram, socialYoutube
  } = useSettings();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/articles/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticle(data.data);
        } else {
          router.push('/');
        }
      })
      .catch(err => {
        console.error('Makale yükleme hatası:', err);
        router.push('/');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const getIcon = (iconName, size = 24) => {
    switch(iconName) {
      case 'Coins': return <Coins size={size} className="text-[#b8860b]" />;
      case 'Gem': return <Gem size={size} className="text-[#b8860b]" />;
      case 'TrendingUp': return <TrendingUp size={size} className="text-[#b8860b]" />;
      case 'CheckCircle': return <CheckCircle size={size} className="text-[#b8860b]" />;
      case 'Star': return <Star size={size} className="text-[#b8860b]" />;
      case 'DollarSign': return <DollarSign size={size} className="text-[#b8860b]" />;
      default: return <Coins size={size} className="text-[#b8860b]" />;
    }
  };

  const formatContent = (content) => {
    if (!content) return '';

    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('###')) {
          return `<h3 key=${index} class="text-xl font-bold text-gray-900 mb-3 mt-6">${paragraph.replace('###', '').trim()}</h3>`;
        }
        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return `<h4 key=${index} class="text-lg font-bold text-gray-900 mb-2 mt-4">${paragraph.replace(/\*\*/g, '')}</h4>`;
        }

        if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
          const items = paragraph.split('\n').filter(line => line.trim().startsWith('- '));
          const listItems = items.map(item =>
            `<li class="mb-2">${item.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
          ).join('');
          return `<ul key=${index} class="list-disc list-inside text-gray-700 leading-relaxed mb-4 ml-4">${listItems}</ul>`;
        }

        if (paragraph.match(/^\d+\./)) {
          const items = paragraph.split('\n').filter(line => line.trim().match(/^\d+\./));
          const listItems = items.map(item =>
            `<li class="mb-2">${item.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
          ).join('');
          return `<ol key=${index} class="list-decimal list-inside text-gray-700 leading-relaxed mb-4 ml-4">${listItems}</ol>`;
        }

        let formatted = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

        return `<p key=${index} class="text-gray-700 leading-relaxed mb-4">${formatted}</p>`;
      })
      .join('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f7de00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{article.title} - NOMANOGLU</title>
        <meta name="description" content={article.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#f7de00]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              <Link href="/" className="flex items-center space-x-2">
                {logoBase64 ? (
                  <img
                    src={logoBase64}
                    alt="Logo"
                    className="object-contain"
                    style={{
                      height: `${Math.min(logoHeight, 40)}px`,
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxWidth: '180px'
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

              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-900 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="font-medium text-sm">Anasayfaya Dön</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Category Badge & Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center space-x-2 px-4 py-2 bg-[#f7de00]/20 text-[#b8860b] rounded-lg text-sm font-semibold">
                <Tag size={14} />
                <span>{article.category}</span>
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#f7de00]/20 flex items-center justify-center">
              {getIcon(article.icon, 28)}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {article.description}
          </p>

          {/* Meta Info */}
          <div className="flex items-center space-x-6 pb-6 mb-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <Calendar size={16} />
              <span>{new Date(article.createdAt || Date.now()).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <button className="flex items-center space-x-2 text-[#b8860b] hover:text-[#a07608] text-sm font-semibold transition-colors">
              <Share2 size={16} />
              <span>Paylaş</span>
            </button>
          </div>

          {/* Main Content */}
          <article className="prose prose-lg max-w-none">
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </article>

          {/* Company Info */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="bg-[#f7de00]/10 border border-[#f7de00]/30 rounded-xl p-5">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-[#f7de00] flex items-center justify-center flex-shrink-0">
                  <Coins className="text-gray-900" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">NOMANOGLU</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    1967'den beri altın ve kıymetli madenler sektöründe güvenilir hizmet sunuyoruz.
                    Yarım asrı aşkın tecrübemizle sizlere en kaliteli ürünleri sunmaktan gurur duyuyoruz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-[#f7de00] hover:bg-[#e5cc00] text-gray-900 font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Tüm Makalelere Dön</span>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
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
                © 2024 AKA Kuyumculuk. Tüm hakları saklıdır.
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

      <style jsx global>{`
        .article-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }
        .article-content h4 {
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
        }
        .article-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #374151;
        }
        .article-content ul,
        .article-content ol {
          margin-bottom: 1rem;
          margin-left: 1rem;
        }
        .article-content li {
          margin-bottom: 0.5rem;
        }
        .article-content strong {
          font-weight: 700;
          color: #111827;
        }
      `}</style>
    </>
  );
}
