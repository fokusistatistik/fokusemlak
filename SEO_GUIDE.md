# FOKUS Emlak SEO İyileştirme Kılavuzu

Bu doküman, FOKUS Emlak web sitesinde yapılan SEO iyileştirmelerini ve uygulama rehberini içerir.

## 📊 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Yapılan İyileştirmeler](#yapılan-iyileştirmeler)
3. [Sayfa Bazlı SEO Detayları](#sayfa-bazlı-seo-detayları)
4. [Yapılandırılmış Veri (Schema.org)](#yapılandırılmış-veri)
5. [Sitemap ve Robots.txt](#sitemap-ve-robots)
6. [Performans Optimizasyonu](#performans-optimizasyonu)
7. [Öneriler ve İleri Adımlar](#öneriler-ve-ileri-adımlar)

---

## Genel Bakış

FOKUS Emlak web sitesi için kapsamlı SEO iyileştirmesi yapılmıştır. Bu iyileştirmeler:

- ✅ Tüm sayfalara meta tag'ler eklendi
- ✅ Open Graph ve Twitter Card desteği
- ✅ Yapılandırılmış veri (JSON-LD) eklendi
- ✅ Dinamik SEO meta tag güncellemesi (listing-detail.html)
- ✅ Breadcrumb navigasyonu eklendi
- ✅ Sitemap.xml oluşturuldu
- ✅ Robots.txt yapılandırıldı
- ✅ Canonical URL'ler eklendi

---

## Yapılan İyileştirmeler

### 1. Meta Tag Optimizasyonu

Her sayfa için özelleştirilmiş meta tag'ler:

```html
<!-- Temel Meta Tags -->
<meta name="description" content="Sayfa açıklaması (150-160 karakter)">
<meta name="keywords" content="anahtar, kelimeler, virgülle, ayrılmış">
<meta name="author" content="FOKUS Emlak">
<meta name="robots" content="index, follow, max-image-preview:large">
```

### 2. Open Graph (Facebook) ve Twitter Card

Sosyal medya paylaşımları için:

```html
<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://fokusemlak.com/">
<meta property="og:title" content="Sayfa Başlığı">
<meta property="og:description" content="Açıklama">
<meta property="og:image" content="Görsel URL">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Sayfa Başlığı">
<meta name="twitter:description" content="Açıklama">
<meta name="twitter:image" content="Görsel URL">
```

### 3. Canonical URL

Duplicate content sorununu önlemek için:

```html
<link rel="canonical" href="https://fokusemlak.com/page.html">
```

---

## Sayfa Bazlı SEO Detayları

### index.html (Ana Sayfa)

**Yapılan İyileştirmeler:**
- ✅ Kapsamlı meta tag'ler (zaten mevcuttu)
- ✅ Open Graph ve Twitter Card (zaten mevcuttu)
- ✅ **YENİ:** Organization Schema (RealEstateAgent)
- ✅ **YENİ:** Website Schema (SearchAction ile)

**Structured Data:**
```json
{
  "@type": "RealEstateAgent",
  "name": "FOKUS Emlak",
  "url": "https://fokusemlak.com",
  "telephone": "+90-262-555-1234",
  "address": { ... },
  "areaServed": ["Kocaeli", "Samsun"],
  "openingHours": { ... }
}
```

### listings.html (İlanlar Sayfası)

**Yapılan İyileştirmeler:**
- ✅ **YENİ:** SEO meta tag'leri eklendi
- ✅ **YENİ:** Open Graph ve Twitter Card eklendi
- ✅ **YENİ:** Breadcrumb navigasyonu (Schema.org BreadcrumbList)
- ✅ **YENİ:** H1 başlığı optimize edildi

**Title:**
```
Satılık ve Kiralık İlanlar - Kocaeli & Samsun | FOKUS Emlak
```

**Meta Description:**
```
FOKUS Emlak'ta Kocaeli ve Samsun'daki satılık ve kiralık daire, villa, 
arsa ve işyeri ilanlarını inceleyin. Yapay zeka destekli emlak değerleme 
ile güvenli alışveriş.
```

**Keywords:**
```
satılık daire, kiralık daire, Kocaeli emlak, Samsun emlak, 
satılık ev, kiralık ev, gayrimenkul ilanları, emlak ilanları
```

### listing-detail.html (İlan Detay Sayfası)

**Yapılan İyileştirmeler:**
- ✅ **YENİ:** Dinamik SEO meta tag güncellemesi
- ✅ **YENİ:** Dinamik Structured Data (Product + RealEstateListing)
- ✅ **YENİ:** Breadcrumb navigasyonu
- ✅ **YENİ:** Open Graph product pricing

**Dinamik SEO Fonksiyonları:**

```javascript
function updateSEOMetaTags(property) {
    // Page Title
    const title = `${propertyType} ${property.rooms} ${property.title} - ${location} | FOKUS Emlak`;
    
    // Meta Description
    const description = `${propertyType} ${property.rooms} daire, ${property.area} m², ${location}. Fiyat: ₺${formattedPrice}...`;
    
    // Keywords
    const keywords = `${propertyType.toLowerCase()}, ${property.rooms}, ${property.city} emlak...`;
    
    // Open Graph
    document.getElementById('og-title').setAttribute('content', title);
    document.getElementById('og-image').setAttribute('content', property.photos[0]);
    
    // Structured Data
    addStructuredData(property);
}
```

**Structured Data:**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Product",
      "name": "İlan Başlığı",
      "price": 2500000,
      "priceCurrency": "TRY",
      "image": ["..."],
      "additionalProperty": [...]
    },
    {
      "@type": "RealEstateListing",
      "name": "İlan Başlığı",
      "price": {...},
      "address": {...},
      "floorSize": {...},
      "numberOfRooms": "3+1"
    }
  ]
}
```

---

## Yapılandırılmış Veri (Schema.org)

### RealEstateAgent (index.html)

Şirket bilgilerini arama motorlarına tanıtır:

```json
{
  "@type": "RealEstateAgent",
  "name": "FOKUS Emlak",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Yahyakaptan Mahallesi",
    "addressLocality": "İzmit",
    "addressRegion": "Kocaeli",
    "addressCountry": "TR"
  },
  "areaServed": [
    { "@type": "City", "name": "Kocaeli" },
    { "@type": "City", "name": "Samsun" }
  ]
}
```

### WebSite (index.html)

Site içi arama özelliği:

```json
{
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://fokusemlak.com/listings.html?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### BreadcrumbList (listings.html, listing-detail.html)

Navigasyon hiyerarşisi:

```html
<nav aria-label="Breadcrumb">
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <a itemprop="item" href="/">
                <span itemprop="name">Ana Sayfa</span>
            </a>
            <meta itemprop="position" content="1" />
        </li>
        <!-- ... -->
    </ol>
</nav>
```

### Product + RealEstateListing (listing-detail.html)

İlan detayları için:

```json
{
  "@type": "Product",
  "name": "Satılık 3+1 Daire",
  "offers": {
    "@type": "Offer",
    "price": 2500000,
    "priceCurrency": "TRY",
    "availability": "https://schema.org/InStock"
  }
}
```

---

## Sitemap ve Robots

### sitemap.xml

Arama motorları için site haritası:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://fokusemlak.com/</loc>
        <lastmod>2025-01-15</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://fokusemlak.com/listings.html</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <!-- ... -->
</urlset>
```

**Önemli:** Dinamik ilan sayfaları için sitemap.xml'i programatik olarak güncellemek gerekir:

```javascript
// Örnek: Supabase'den ilanları çekip sitemap'e ekle
async function generateDynamicSitemap() {
    const properties = await SupabaseClient.fetchProperties();
    
    properties.forEach(property => {
        // sitemap.xml'e ekle
        addToSitemap({
            loc: `https://fokusemlak.com/listing-detail.html?id=${property.id}`,
            lastmod: property.updated_at,
            changefreq: 'weekly',
            priority: 0.8
        });
    });
}
```

### robots.txt

Tarama kuralları:

```
User-agent: *
Allow: /

# Gizli sayfalar
Disallow: /admin/
Disallow: /user-dashboard.html
Disallow: /pending-approval.html

# Sitemap
Sitemap: https://fokusemlak.com/sitemap.xml

# Kötü botlar
User-agent: AhrefsBot
Disallow: /
```

---

## Performans Optimizasyonu

### 1. Lazy Loading (Görseller)

```html
<img src="image.jpg" loading="lazy" alt="Açıklama">
```

**Uygulanmalı Sayfalar:**
- listings.html (ilan görselleri)
- listing-detail.html (fotoğraf galerisi)
- blog.html (blog görselleri)

### 2. Image Optimization

**Önerilen Format:** WebP
```html
<picture>
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="Açıklama">
</picture>
```

### 3. Preconnect ve DNS-Prefetch

```html
<!-- index.html head'e ekle -->
<link rel="preconnect" href="https://cdn.tailwindcss.com">
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="https://static.fokusistatistik.com">
```

### 4. Critical CSS

İlk yükleme için kritik CSS inline ekle:

```html
<style>
    /* Critical CSS - above the fold */
    .navbar { ... }
    .hero-section { ... }
</style>
```

---

## Öneriler ve İleri Adımlar

### 1. Google Search Console

**Yapılması Gerekenler:**
- [ ] Site'yi Google Search Console'a ekle
- [ ] sitemap.xml'i submit et
- [ ] Core Web Vitals'ı kontrol et
- [ ] Mobile-friendly test yap
- [ ] Rich Results test yap

**URL:**
```
https://search.google.com/search-console
```

### 2. Bing Webmaster Tools

**Yapılması Gerekenler:**
- [ ] Site'yi Bing Webmaster Tools'a ekle
- [ ] sitemap.xml'i submit et

**URL:**
```
https://www.bing.com/webmasters
```

### 3. Local SEO (Google My Business)

**Yapılması Gerekenler:**
- [ ] Google My Business profili oluştur
- [ ] Kocaeli ve Samsun lokasyonları ekle
- [ ] NAP (Name, Address, Phone) tutarlılığını sağla
- [ ] Müşteri yorumlarını topla

### 4. Schema Markup Validation

**Test Araçları:**
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

### 5. Page Speed Optimization

**Test Araçları:**
- Google PageSpeed Insights: https://pagespeed.web.dev/
- GTmetrix: https://gtmetrix.com/

**Hedef Skorlar:**
- Mobile Performance: 90+
- Desktop Performance: 95+
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 200ms

### 6. Content Strategy

**Blog Yazıları için SEO:**
- [ ] Keyword research yap (Ahrefs, SEMrush, Google Keyword Planner)
- [ ] Her blog için focus keyword belirle
- [ ] H1, H2, H3 yapısını optimize et
- [ ] Internal linking stratejisi oluştur
- [ ] Alt text'leri eksiksiz doldur

**Örnek Başlıklar:**
- "Kocaeli'de Ev Fiyatları 2025: İlçe İlçe Analiz"
- "İlk Ev Alacaklar İçin 10 Altın Kural"
- "Mortgage Hesaplama: Adım Adım Rehber"

### 7. Backlink Strategy

**Yapılması Gerekenler:**
- [ ] Yerel dizinlere kayıt (Yemeksepeti, Hürriyet Emlak, vb.)
- [ ] Guest blog yazıları
- [ ] Infografik oluştur ve paylaş
- [ ] Emlak blogları ile işbirliği
- [ ] Basın bültenleri

### 8. Technical SEO Audit

**Kontrol Listesi:**
- [ ] Broken links kontrolü (Screaming Frog)
- [ ] Redirect chain'ler
- [ ] Duplicate content
- [ ] SSL certificate (HTTPS)
- [ ] XML sitemap errors
- [ ] Robots.txt errors
- [ ] Hreflang tags (çoklu dil varsa)
- [ ] AMP implementation (mobil için)

### 9. Analytics Setup

**Google Analytics 4:**
```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Custom Events:**
- Property view
- Favorite added
- Share clicked
- Contact form submitted
- Chatbot inquiry

### 10. Dinamik Sitemap Oluşturma

**Backend Script (Node.js örneği):**

```javascript
const { createWriteStream } = require('fs');
const { SitemapStream } = require('sitemap');

async function generateSitemap() {
    const sitemap = new SitemapStream({ hostname: 'https://fokusemlak.com' });
    const writeStream = createWriteStream('./sitemap.xml');
    
    sitemap.pipe(writeStream);
    
    // Statik sayfalar
    sitemap.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    sitemap.write({ url: '/listings.html', changefreq: 'daily', priority: 0.9 });
    
    // Dinamik ilanlar
    const properties = await getPropertiesFromDB();
    properties.forEach(property => {
        sitemap.write({
            url: `/listing-detail.html?id=${property.id}`,
            lastmod: property.updated_at,
            changefreq: 'weekly',
            priority: 0.8,
            img: property.photos.map(photo => ({
                url: photo,
                title: property.title
            }))
        });
    });
    
    sitemap.end();
}
```

---

## Checklist - Yapılacaklar

### Hemen Yapılması Gerekenler (Yüksek Öncelik)
- [ ] Google Search Console'a site ekleme
- [ ] sitemap.xml submit etme
- [ ] Google Analytics kurulumu
- [ ] Alt text'leri tüm görsellere ekleme
- [ ] Lazy loading implementasyonu

### Kısa Vadede (1 Hafta)
- [ ] Dinamik sitemap generator oluşturma
- [ ] Blog sayfalarına SEO meta tag'leri ekleme
- [ ] Local SEO optimizasyonu (Google My Business)
- [ ] Page speed optimization
- [ ] Schema markup validation

### Orta Vadede (1 Ay)
- [ ] Content strategy oluşturma
- [ ] Backlink building başlatma
- [ ] Competitor analysis
- [ ] Keyword research ve content plan
- [ ] Internal linking stratejisi

### Uzun Vadede (3-6 Ay)
- [ ] Authority building
- [ ] Link building kampanyaları
- [ ] SEO performans raporlama
- [ ] A/B testing (meta descriptions, titles)
- [ ] Voice search optimization

---

## Faydalı Kaynaklar

### SEO Araçları
- **Google Search Console:** https://search.google.com/search-console
- **Google Analytics:** https://analytics.google.com/
- **Google PageSpeed Insights:** https://pagespeed.web.dev/
- **Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Markup Generator:** https://technicalseo.com/tools/schema-markup-generator/

### Keyword Research
- **Google Keyword Planner:** https://ads.google.com/home/tools/keyword-planner/
- **Ubersuggest:** https://neilpatel.com/ubersuggest/
- **AnswerThePublic:** https://answerthepublic.com/

### Technical SEO
- **Screaming Frog:** https://www.screamingfrog.co.uk/seo-spider/
- **GTmetrix:** https://gtmetrix.com/
- **Pingdom:** https://tools.pingdom.com/

### Learning Resources
- **Google SEO Starter Guide:** https://developers.google.com/search/docs/beginner/seo-starter-guide
- **Moz Beginner's Guide to SEO:** https://moz.com/beginners-guide-to-seo
- **Schema.org Documentation:** https://schema.org/docs/full.html

---

## Sonuç

FOKUS Emlak web sitesinde kapsamlı SEO iyileştirmesi yapılmıştır. Bu iyileştirmeler:

✅ **Teknik SEO:** Tamamlandı (meta tags, structured data, sitemap, robots.txt)  
✅ **On-Page SEO:** Tamamlandı (başlıklar, açıklamalar, breadcrumbs)  
⏳ **Off-Page SEO:** Yapılacak (backlinks, local SEO)  
⏳ **Content SEO:** Yapılacak (blog optimizasyonu, keyword strategy)  
⏳ **Performance:** Yapılacak (lazy loading, image optimization)

**Beklenen Sonuçlar (3-6 Ay):**
- Google'da organik sıralamada yükselme
- Yerel aramalarda (Kocaeli, Samsun) üst sıralarda görünme
- Site trafiğinde %50-100 artış
- Sosyal medya paylaşımlarında artış
- Rich snippets görünümü (yıldızlar, fiyatlar, breadcrumbs)

---

**Son Güncelleme:** 2025-01-15  
**Versiyon:** 1.0  
**Hazırlayan:** FOKUS Emlak Teknik Ekip
