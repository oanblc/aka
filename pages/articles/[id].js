import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Share2, TrendingUp, Coins, Gem, CheckCircle, Star, DollarSign } from 'lucide-react';

export default function ArticleDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [logoWidth, setLogoWidth] = useState('auto');

  useEffect(() => {
    if (!id) return;

    // Makaleyi yükle
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/articles/${id}`)
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
  }, [id]);

  const getIcon = (iconName, size = 24) => {
    switch(iconName) {
      case 'Coins': return <Coins size={size} className="text-amber-600" strokeWidth={2} />;
      case 'Gem': return <Gem size={size} className="text-amber-600" strokeWidth={2} />;
      case 'TrendingUp': return <TrendingUp size={size} className="text-amber-600" strokeWidth={2} />;
      case 'CheckCircle': return <CheckCircle size={size} className="text-amber-600" strokeWidth={2} />;
      case 'Star': return <Star size={size} className="text-amber-600" strokeWidth={2} />;
      case 'DollarSign': return <DollarSign size={size} className="text-amber-600" strokeWidth={2} />;
      default: return <Coins size={size} className="text-amber-600" strokeWidth={2} />;
    }
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Basit markdown formatlaması
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Başlık kontrolü (### veya **)
        if (paragraph.startsWith('###')) {
          return `<h3 key=${index} class="text-xl font-bold text-gray-900 mb-3 mt-6">${paragraph.replace('###', '').trim()}</h3>`;
        }
        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
          return `<h4 key=${index} class="text-lg font-bold text-gray-900 mb-2 mt-4">${paragraph.replace(/\*\*/g, '')}</h4>`;
        }
        
        // Liste kontrolü
        if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
          const items = paragraph.split('\n').filter(line => line.trim().startsWith('- '));
          const listItems = items.map(item => 
            `<li class="mb-2">${item.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
          ).join('');
          return `<ul key=${index} class="list-disc list-inside text-gray-700 leading-relaxed mb-4 ml-4">${listItems}</ul>`;
        }
        
        // Numaralı liste
        if (paragraph.match(/^\d+\./)) {
          const items = paragraph.split('\n').filter(line => line.trim().match(/^\d+\./));
          const listItems = items.map(item => 
            `<li class="mb-2">${item.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
          ).join('');
          return `<ol key=${index} class="list-decimal list-inside text-gray-700 leading-relaxed mb-4 ml-4">${listItems}</ol>`;
        }
        
        // Normal paragraf - kalın ve italik formatlaması
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
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
        <title>{article.title} - NOMANOĞLU</title>
        <meta name="description" content={article.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 border-b border-amber-700 sticky top-0 z-50 shadow-lg">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <Link href="/">
                {logoBase64 ? (
                  <img 
                    src={logoBase64} 
                    alt="Logo" 
                    className="object-contain cursor-pointer" 
                    style={{ 
                      height: `${logoHeight}px`, 
                      width: logoWidth === 'auto' ? 'auto' : `${logoWidth}px`,
                      maxWidth: '300px'
                    }} 
                  />
                ) : (
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="text-white" size={22} />
                    </div>
                    <span className="text-xl font-bold text-white drop-shadow-md">NOMANOĞLU</span>
                  </div>
                )}
              </Link>

              <Link 
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Anasayfaya Dön</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* Kategori Badge & İkon */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
                <Tag size={16} />
                <span>{article.category}</span>
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              {getIcon(article.icon, 32)}
            </div>
          </div>

          {/* Başlık */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Kısa Açıklama */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {article.description}
          </p>

          {/* Meta Bilgiler */}
          <div className="flex items-center space-x-6 pb-8 mb-8 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <Calendar size={16} />
              <span>{new Date(article.createdAt || Date.now()).toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <button className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 text-sm font-semibold transition-colors">
              <Share2 size={16} />
              <span>Paylaş</span>
            </button>
          </div>

          {/* Ana İçerik */}
          <article className="prose prose-lg max-w-none">
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </article>

          {/* Alt Bilgi */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">NOMANOĞLU</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    1967'den beri altın ve kıymetli madenler sektöründe güvenilir hizmet sunuyoruz. 
                    Yarım asrı aşkın tecrübemizle sizlere en kaliteli ürünleri sunmaktan gurur duyuyoruz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Geri Dön Butonu */}
          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={18} />
              <span>Tüm Makalelere Dön</span>
            </Link>
          </div>
        </main>
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

