# Gerekli Medya ve Asset Listesi

Bu dokümantasyon, FOKUS Emlak projesinin tam fonksiyonel olması için gerekli görsel ve medya dosyalarını listeler.

## 🎨 Öncelikli Görseller

### 1. Chatbot İkonu
**Dosya:** `/assets/img/fokus216kare.png`
- **Boyut:** 512x512px (minimum 200x200px)
- **Format:** PNG (şeffaf arkaplan)
- **Kullanım:** Chatbot widget'ı için ana ikon
- **Tasarım:** FOKUS216 logosu/branding
- **Referans:** chatbot.js:100

### 2. PWA İkonları
Progressive Web App özelliği için gerekli ikonlar:

#### App İkonları
**Konum:** `/assets/img/`

| Dosya Adı | Boyut | Format | Kullanım |
|-----------|-------|--------|----------|
| `icon-72x72.png` | 72x72px | PNG | Küçük cihazlar |
| `icon-96x96.png` | 96x96px | PNG | Orta cihazlar |
| `icon-128x128.png` | 128x128px | PNG | Normal cihazlar |
| `icon-144x144.png` | 144x144px | PNG | HD cihazlar |
| `icon-152x152.png` | 152x152px | PNG | iPad |
| `icon-192x192.png` | 192x192px | PNG | Android (standart) |
| `icon-384x384.png` | 384x384px | PNG | Android (büyük) |
| `icon-512x512.png` | 512x512px | PNG | Maskable icon |

**Tasarım Notu:**
- Tüm ikonlar FOKUS logo/branding içermeli
- 192x192 ve 512x512 özellikle önemli (PWA minimum gereksinim)
- Arka plan şeffaf olmamalı (solid renk kullanın)

#### Favicon
**Konum:** `/`
- `favicon.ico` - 16x16, 32x32 multi-size ICO formatı
- Tarayıcı sekmesi ikonu

### 3. Placeholder Görseller
**Konum:** `/assets/img/`

| Dosya | Boyut | Kullanım |
|-------|-------|----------|
| `property-placeholder.jpg` | 800x600px | İlan görseli yoksa |
| `avatar-placeholder.png` | 200x200px | Kullanıcı avatarı yoksa |
| `blog-placeholder.jpg` | 1200x630px | Blog görseli yoksa |

### 4. Hero/Banner Görseller
**Konum:** `/assets/img/`

| Dosya | Boyut | Kullanım |
|-------|-------|----------|
| `hero-bg.jpg` | 1920x1080px | Ana sayfa hero arka plan |
| `about-hero.jpg` | 1920x600px | Hakkımızda sayfası banner |
| `contact-hero.jpg` | 1920x600px | İletişim sayfası banner |

### 5. Logo Varyasyonları
**Konum:** `/assets/img/`

| Dosya | Format | Kullanım |
|-------|--------|----------|
| `logo.svg` | SVG | Ana logo (vektör) |
| `logo-white.svg` | SVG | Beyaz versiyon (koyu arkaplan için) |
| `logo-square.png` | PNG 512x512 | Kare logo |
| `logo-horizontal.png` | PNG | Yatay kullanım |

### 6. Özellik İkonları (Opsiyonel)
**Konum:** `/assets/img/icons/`

- `ai-icon.svg` - AI özellikler
- `security-icon.svg` - Güvenlik
- `data-icon.svg` - Veri analizi
- `support-icon.svg` - Destek

---

## 📄 Diğer Dosyalar

### 1. Yasal Dökümanlar
**Konum:** `/assets/docs/`

| Dosya | İçerik |
|-------|--------|
| `kvkk.pdf` | KVKK Aydınlatma Metni |
| `gizlilik.pdf` | Gizlilik Politikası |
| `kullanim-kosullari.pdf` | Kullanım Koşulları |
| `cerez-politikasi.pdf` | Çerez Politikası |

### 2. Örnek Raporlar
**Konum:** `/assets/templates/`

| Dosya | İçerik |
|-------|--------|
| `valuation-report-template.html` | Değerleme raporu şablonu |
| `market-report-template.html` | Pazar raporu şablonu |

---

## 🎬 Video ve Multimedya (Opsiyonel)

### 1. Tanıtım Videoları
**Konum:** `/assets/video/`

| Dosya | Süre | Kullanım |
|-------|------|----------|
| `intro.mp4` | 30 saniye | Ana sayfa intro |
| `how-it-works.mp4` | 1-2 dakika | Nasıl çalışır? |

### 2. Animasyonlar
**Konum:** `/assets/animations/`

- `loading.json` - Lottie loading animasyonu
- `success.json` - Başarılı işlem animasyonu
- `error.json` - Hata animasyonu

---

## 🔧 Geçici Çözümler (Development)

Görseller hazır değilken kullanılabilecek placeholder servisler:

### 1. Unsplash (Ücretsiz Stock Photos)
```javascript
// Property images
`https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop`

// Real estate
`https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop`
```

### 2. UI Avatars (Avatar Placeholder)
```javascript
`https://ui-avatars.com/api/?name=Ahmet+Yilmaz&size=200&background=1e3a8a&color=fff`
```

### 3. Placeholder.com
```javascript
`https://via.placeholder.com/800x600/1e3a8a/ffffff?text=FOKUS+Emlak`
```

### 4. Dicebear (Avatar Generator)
```javascript
`https://api.dicebear.com/7.x/initials/svg?seed=Ahmet%20Yilmaz`
```

---

## 🎨 Tasarım Kılavuzu

### Renk Paleti
```css
/* Primary Colors */
--blue-900: #1e3a8a;
--amber-500: #f59e0b;

/* Secondary Colors */
--slate-50: #f8fafc;
--slate-900: #0f172a;

/* Accent Colors */
--green-500: #22c55e;  /* Success */
--red-500: #ef4444;    /* Error */
```

### Tipografi
- **Font:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700

### Icon Set
- **Font Awesome 6.4.0** (CDN üzerinden yüklü)
- Ek ikonlara ihtiyaç varsa Heroicons veya Feather Icons kullanılabilir

---

## ✅ Kontrol Listesi

Projenin tam fonksiyonel olması için:

### Kritik (Mutlaka Gerekli)
- [ ] `fokus216kare.png` - Chatbot ikonu
- [ ] `icon-192x192.png` - PWA minimum ikon
- [ ] `icon-512x512.png` - PWA minimum ikon
- [ ] `favicon.ico` - Tarayıcı ikonu
- [ ] `logo.svg` - Ana logo

### Önemli (Kullanıcı Deneyimi İçin)
- [ ] `property-placeholder.jpg` - İlan placeholder
- [ ] `avatar-placeholder.png` - Avatar placeholder
- [ ] `hero-bg.jpg` - Ana sayfa hero

### Opsiyonel (İyileştirmeler)
- [ ] Diğer PWA ikonları (72px, 96px, vb.)
- [ ] Logo varyasyonları
- [ ] Banner görselleri
- [ ] Video içerikler
- [ ] Animasyonlar

---

## 📋 Asset Hazırlama Adımları

### 1. Logo/İkon Tasarımı
1. FOKUS brand renklerini kullan (blue-900, amber-500)
2. Modern, minimal tasarım
3. Hem light hem dark mode için uygun
4. SVG formatında kaydet (ölçeklenebilir)

### 2. PWA İkonları Oluşturma
Tek bir yüksek çözünürlük ikon (1024x1024) ile:

**Online Araçlar:**
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Tüm ikonları otomatik oluşturur
- [PWA Asset Generator](https://progressier.com/pwa-icon-generator) - PWA ikonları

**Manuel Yöntem:**
```bash
# ImageMagick ile
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
```

### 3. Optimizasyon
```bash
# PNG optimizasyon
pngquant --quality=65-80 image.png

# JPG optimizasyon
jpegoptim --max=85 image.jpg

# WebP dönüşüm (modern format)
cwebp -q 80 image.jpg -o image.webp
```

---

## 🔗 Faydalı Kaynaklar

- **Unsplash**: https://unsplash.com/ - Ücretsiz stock fotoğraflar
- **Pexels**: https://pexels.com/ - Ücretsiz stock fotoğraflar
- **Flaticon**: https://flaticon.com/ - İkonlar
- **Undraw**: https://undraw.co/ - İllüstrasyonlar
- **Lottie Files**: https://lottiefiles.com/ - Animasyonlar

---

## 📞 Destek

Asset'ler hakkında sorularınız için:
- **Email**: developer@fokusemlak.com

**Son Güncelleme:** 24 Kasım 2024
