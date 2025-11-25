#!/bin/bash

# FOKUS Emlak İndirilebilir Paket Oluşturma

echo "📦 FOKUS Emlak indirilebilir paket oluşturuluyor..."

# Geçici dizin oluştur
TEMP_DIR="fokusemlak-static"
mkdir -p $TEMP_DIR

# HTML sayfalarını kopyala
echo "📄 HTML sayfaları kopyalanıyor..."
cp *.html $TEMP_DIR/ 2>/dev/null

# Assets klasörünü kopyala
echo "🎨 Assets kopyalanıyor..."
cp -r assets $TEMP_DIR/ 2>/dev/null

# Admin klasörünü kopyala
echo "👨‍💼 Admin paneli kopyalanıyor..."
cp -r admin $TEMP_DIR/ 2>/dev/null

# SEO dosyalarını kopyala
echo "🔍 SEO dosyaları kopyalanıyor..."
cp sitemap.xml robots.txt $TEMP_DIR/ 2>/dev/null

# Dokümanları kopyala
echo "📚 Dokümanlar kopyalanıyor..."
cp *.md $TEMP_DIR/ 2>/dev/null

# README oluştur
echo "📝 README oluşturuluyor..."
cat > $TEMP_DIR/README.txt << 'READMEEOF'
FOKUS EMLAK - Statik Site Paketi
================================

Bu paket FOKUS Emlak web sitesinin statik dosyalarını içerir.

KURULUM:
--------

1. Basit HTTP server ile çalıştırma:

   Python 3:
   python3 -m http.server 8000

   Node.js:
   npx http-server -p 8000

2. Tarayıcınızda açın:
   http://localhost:8000

NOT: Dinamik özellikler (veritabanı, API) çalışmaz.
Tam özellikli site için backend bağlantıları gereklidir.

DOSYA YAPISI:
------------
├── index.html          # Ana sayfa
├── listings.html       # İlanlar sayfası
├── listing-detail.html # İlan detay
├── login.html         # Giriş sayfası
├── user-dashboard.html # Kullanıcı paneli
├── assets/            # CSS, JS, resimler
│   ├── css/
│   ├── js/
│   └── images/
├── admin/             # Admin panel
├── sitemap.xml        # SEO sitemap
└── robots.txt         # Robots dosyası

İletişim: info@fokusemlak.com
Web: https://fokusemlak.com
READMEEOF

# ZIP oluştur
echo "🗜️ ZIP dosyası oluşturuluyor..."
zip -r fokusemlak-static.zip $TEMP_DIR

# Temizlik
rm -rf $TEMP_DIR

echo "✅ İndirilebilir paket hazır: fokusemlak-static.zip"
echo "📊 Dosya boyutu: $(du -h fokusemlak-static.zip | cut -f1)"
