# FOKUS Emlak - Yapay Zeka Destekli Emlak Platformu

Modern, responsive ve yapay zeka destekli yeni nesil emlak danışmanlık web sitesi.

## 🚀 Özellikler

### 🤖 Yapay Zeka Araçları
- **AI Değerleme**: Anlık mülk değerleme sistemi
- **Sanal Tadilat**: Before/After görselleştirme
- **Akıllı Arama**: Sesli arama ve filtre sistemi

### 📊 Veri & Analiz
- **Canlı Piyasa Ticker**: Anlık pazar verileri
- **Isı Haritası**: Bölgesel değer artış analizi
- **Otomatik Raporlar**: E-posta ile pazar raporları

### 🎯 Kullanıcı Özellikleri
- **Google OAuth**: Güvenli giriş sistemi
- **Test Login**: Geliştirme için bypass modu
- **Dashboard**: Kişisel kullanıcı paneli
- **Favoriler**: İlan kaydetme sistemi
- **Yol Arkadaşım**: Süreç takip sistemi

## 📁 Proje Yapısı

```
fokusemlak/
├── index.html              # Ana sayfa
├── login.html              # Giriş/Kayıt
├── dashboard.html          # Kullanıcı paneli
├── listings.html           # İlan listesi
├── listing-detail.html     # İlan detay
├── sell-property.html      # Mülk sat/kirala formu
├── tracker.html            # Süreç takip
├── about.html              # Hakkımızda
├── contact.html            # İletişim
├── blog.html               # Blog listesi
├── blog-detail.html        # Blog detay
├── privacy.html            # KVKK & Gizlilik
├── terms.html              # Kullanım koşulları
└── assets/
    ├── css/
    │   └── style.css       # Özel stiller
    ├── js/
    │   ├── api.js          # API entegrasyonu
    │   ├── auth.js         # Kimlik doğrulama
    │   └── main.js         # Ana JavaScript
    └── img/                # Görseller
```

## 🔌 Backend Entegrasyonu (n8n)

### Webhook Endpoints

Tüm backend işlemleri `n8n.fokusistatistik.com` üzerinden webhook ile çalışır:

#### Kimlik Doğrulama
- `POST /webhook/auth/register` - Kullanıcı kaydı
- `POST /webhook/auth/login` - Giriş
- `POST /webhook/auth/google` - Google OAuth
- `POST /webhook/auth/logout` - Çıkış

#### Emlak İşlemleri
- `POST /webhook/property/search` - İlan arama
- `GET /webhook/property/get/:id` - İlan detay
- `GET /webhook/property/all` - Tüm ilanlar

#### AI Araçları
- `POST /webhook/ai/valuation` - Mülk değerleme
- `POST /webhook/ai/renovation` - Sanal tadilat

#### Lead & İletişim
- `POST /webhook/lead/submit` - Talep formu
- `POST /webhook/property/sell` - Mülk sat/kirala
- `POST /webhook/contact/submit` - İletişim formu
- `POST /webhook/newsletter/subscribe` - Bülten kaydı
- `GET /webhook/tracker/:code` - Süreç sorgula

#### Veri & Content
- `GET /webhook/data/market` - Pazar verileri
- `GET /webhook/data/heatmap` - Isı haritası
- `GET /webhook/blog/all` - Blog yazıları
- `GET /webhook/blog/get/:slug` - Blog detay

### n8n Workflow Önerileri

1. **Auth Workflow**: Kullanıcı kaydı → Email doğrulama → CRM'e kayıt
2. **Lead Workflow**: Form → Validasyon → CRM → SMS/Email bildirim → Atama
3. **Valuation Workflow**: Form → AI hesaplama → Sonuç → Lead oluştur
4. **Newsletter Workflow**: Kayıt → Database → Aylık rapor gönderimi
5. **Tracker Workflow**: Kod sorgula → Database'den getir → Status döndür

## 🛠️ Kurulum

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/YOUR_USERNAME/fokusemlak.git
cd fokusemlak
```

### 2. Basit HTTP Server Başlatın
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

### 3. Tarayıcıda Açın
```
http://localhost:8000
```

## ⚙️ Yapılandırma

### API Base URL
`/assets/js/api.js` dosyasında:
```javascript
const API = {
    baseURL: 'https://n8n.fokusistatistik.com',
    // ...
};
```

### Google OAuth
`login.html` ve `/assets/js/auth.js` dosyalarında:
```javascript
client_id: 'YOUR_GOOGLE_CLIENT_ID'
```

## 🧪 Test Modu

Geliştirme sırasında Google OAuth olmadan test yapabilirsiniz:

**Login sayfasında:**
- "Test Hesabı ile Gir" butonuna tıklayın
- Otomatik olarak test kullanıcısı ile giriş yapılır
- Dashboard'a yönlendirilirsiniz

**Kod içinde:**
```javascript
Auth.testLogin('test@fokusemlak.com');
```

## 🎨 Tasarım Sistemi

### Renkler
- **Primary**: Blue-900 (#1e3a8a)
- **Secondary**: Amber-500 (#f59e0b)
- **Success**: Green-500
- **Warning**: Amber-500
- **Error**: Red-500

### Tipografi
- **Font**: Inter (Google Fonts)
- **Başlıklar**: Bold, 2xl-5xl
- **Body**: Regular, base-lg

### Componentler
- **Buttons**: `.btn-primary`, `.btn-secondary`
- **Forms**: `.form-input`, `.form-select`
- **Cards**: `.property-card`, `.hover-lift`
- **Badges**: `.badge-success`, `.badge-warning`

## 📱 Responsive Tasarım

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Tüm sayfalar mobil öncelikli tasarlanmıştır.

## 🔐 Güvenlik

- XSS koruması (input sanitization)
- CSRF token kullanımı (backend'de)
- Secure cookie ayarları
- HTTPS zorunluluğu (production)
- Rate limiting (n8n webhook'larında)

## 📦 Bağımlılıklar

### CDN üzerinden yüklenenler:
- **Tailwind CSS** 3.x (CDN)
- **Font Awesome** 6.4.0
- **Google Fonts** (Inter)
- **Google Sign-In SDK**

### Kendi dosyalarımız:
- Custom CSS (`/assets/css/style.css`)
- API modülü (`/assets/js/api.js`)
- Auth modülü (`/assets/js/auth.js`)
- Main JS (`/assets/js/main.js`)

## 🚀 Production Deployment

### 1. Domain Ayarları
- Domain: `www.fokusemlak.com`
- SSL sertifikası (Let's Encrypt)

### 2. Environment Variables
```env
API_BASE_URL=https://n8n.fokusistatistik.com
GOOGLE_CLIENT_ID=your_client_id
```

### 3. Optimize Edilecekler
- [ ] CSS/JS minification
- [ ] Image optimization (WebP)
- [ ] Lazy loading
- [ ] CDN kullanımı
- [ ] Caching stratejisi

### 4. SEO
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Meta tags
- [ ] Open Graph
- [ ] Schema.org markup

## 📊 Analitik

Entegre edilebilir:
- **Google Analytics 4**
- **Meta Pixel**
- **Hotjar** (Heatmap)
- **n8n Analytics Webhook**

## 🐛 Hata Ayıklama

### Browser Console
```javascript
// Auth durumu kontrol
console.log(Auth.isAuthenticated());
console.log(Auth.getCurrentUser());

// API test
API.searchProperties({city: 'Kocaeli'}).then(console.log);
```

### Yaygın Sorunlar

**Problem**: Google girişi çalışmıyor
**Çözüm**: Google Client ID'yi kontrol edin

**Problem**: API bağlantısı başarısız
**Çözüm**: CORS ayarlarını ve n8n webhook URL'sini kontrol edin

**Problem**: Sayfalar yüklenmiyor
**Çözüm**: Console'da JavaScript hatalarını kontrol edin

## 📞 Destek

- **Email**: developer@fokusemlak.com
- **GitHub Issues**: [Sorun Bildir](https://github.com/YOUR_USERNAME/fokusemlak/issues)

## 📝 Lisans

Copyright © 2024 FOKUS Emlak. Tüm hakları saklıdır.

---

**Geliştirici Notları:**

Bu proje Claude AI ile geliştirilmiştir.
Tüm backend işlemleri n8n webhook entegrasyonu ile yapılmaktadır.
Production'a geçmeden önce test edilmelidir.

Son Güncelleme: 23 Kasım 2024
