# 🚀 FOKUS Emlak - Supabase Quick Start

## ⚡ 5 Dakikada Başlangıç

### 1. Supabase Projesi Oluştur (2 dk)
```bash
1. https://supabase.com → "Start your project"
2. New Project:
   - Name: fokus-emlak
   - Password: [güçlü şifre]
   - Region: Europe (Frankfurt)
3. API bilgilerini kopyala (Settings > API):
   - Project URL
   - Anon Key
```

### 2. Database Kur (1 dk)
```bash
1. Supabase Dashboard → SQL Editor
2. supabase-migration.sql dosyasını aç
3. Tüm içeriği kopyala → yapıştır → Run (F5)
4. "Success" mesajını gör ✅
```

### 3. Storage Kur (1 dk)
```bash
1. Supabase Dashboard → Storage
2. New bucket: "property-images" (public, 10MB limit)
3. New bucket: "blog-images" (public, 5MB limit)
```

### 4. Admin Kullanıcısı Oluştur (1 dk)
```bash
1. Dashboard → Authentication → Users → Add user
   - Email: admin@fokusemlak.com
   - Password: [güçlü şifre]
   - Auto Confirm: ✅

2. SQL Editor'de çalıştır:
   SELECT id FROM auth.users WHERE email = 'admin@fokusemlak.com';

   INSERT INTO user_profiles (id, full_name, role)
   VALUES ('[yukarıdaki-id]', 'Admin', 'admin');
```

### 5. Frontend'i Bağla (30 sn)
```javascript
// assets/js/supabase-client.js dosyasını aç
config: {
    url: 'BURAYA_PROJECT_URL',     // Adım 1'den
    anonKey: 'BURAYA_ANON_KEY'      // Adım 1'den
}
```

### 6. Test Et! 🎉
```bash
1. Admin panel aç: /admin/supabase-admin.html
2. Giriş yap: admin@fokusemlak.com
3. Yeni ilan oluştur
4. Ana sayfada görün: /index.html
```

---

## 📁 Dosya Yapısı

```
fokusemlak/
├── SUPABASE_ARCHITECTURE.md     # Teknik mimari dokümantasyonu
├── SUPABASE_SETUP_GUIDE.md      # Detaylı kurulum rehberi
├── SUPABASE_QUICKSTART.md       # Bu dosya (hızlı başlangıç)
├── supabase-migration.sql       # Database schema (çalıştır!)
│
├── assets/js/
│   ├── supabase-client.js       # Supabase API client
│   ├── ai-search.js             # AI destekli arama
│   ├── analytics.js             # Google Analytics
│   ├── security.js              # XSS koruması
│   └── language.js              # Çoklu dil desteği
│
├── admin/
│   ├── supabase-admin.html      # Yeni admin panel (Supabase)
│   └── index.html               # Eski admin panel (localStorage)
│
└── [diğer HTML sayfaları]
```

---

## 🎯 Özellikler

### ✅ Backend (Supabase)
- **PostgreSQL Database** - İlanlar, bloglar, leadler
- **Row Level Security** - Güvenli veri erişimi
- **Authentication** - Email/password (Google OAuth hazır)
- **Storage** - CDN ile görsel depolama
- **Real-time** - Canlı güncellemeler (opsiyonel)
- **Edge Functions** - Serverless fonksiyonlar (opsiyonel)

### ✅ Admin Panel
- İlan yönetimi (CRUD)
- Blog yönetimi (CRUD)
- Lead takibi
- Drag & drop fotoğraf yükleme
- Yayınlama kontrolü
- Dashboard istatistikleri

### ✅ Frontend
- AI destekli arama
- Çoklu dil (TR/EN/AR)
- Google Analytics
- XSS koruması
- Responsive tasarım
- PWA desteği

---

## 🔄 Veri Akışı

```
Kullanıcı
   ↓
Frontend (HTML/JS)
   ↓
supabase-client.js (API istekleri)
   ↓
Supabase (PostgreSQL + Storage)
   ↓
RLS Policies (güvenlik kontrolü)
   ↓
Data Return
```

---

## 📊 Database Tabloları

| Tablo | Açıklama | Ana Alanlar |
|-------|----------|-------------|
| **properties** | Emlak ilanları | title, price, city, photos, published |
| **blogs** | Blog yazıları | title, content, category, author |
| **leads** | Müşteri leadleri | name, email, phone, source, status |
| **categories** | Blog kategorileri | name, slug, icon |
| **user_profiles** | Admin kullanıcıları | role (admin/editor/viewer) |

---

## 🔐 Güvenlik

### Row Level Security (RLS) Örnekleri:

**Properties (Public görüntüleme):**
```sql
CREATE POLICY "Public can view published properties"
ON properties FOR SELECT
USING (published = true AND status = 'active');
```

**Leads (Herkes gönderebilir):**
```sql
CREATE POLICY "Anyone can submit leads"
ON leads FOR INSERT
WITH CHECK (true);
```

**Properties (Sadece admin düzenleyebilir):**
```sql
CREATE POLICY "Admins can update properties"
ON properties FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 🛠️ API Kullanım Örnekleri

### İlanları Getir
```javascript
const result = await SupabaseClient.fetchProperties({
    city: 'İzmit',
    transaction_type: 'Satılık',
    priceMax: 5000000,
    limit: 20
});

if (result.success) {
    console.log(result.data); // İlan listesi
}
```

### Yeni İlan Oluştur (Admin)
```javascript
const result = await SupabaseClient.createProperty({
    title: 'İzmit Merkezde 3+1 Daire',
    description: 'Deniz manzaralı...',
    transaction_type: 'Satılık',
    property_type: 'Daire',
    price: 4500000,
    city: 'Kocaeli',
    district: 'İzmit',
    rooms: '3+1',
    published: true,
    featured: false
});
```

### Lead Gönder
```javascript
const result = await SupabaseClient.submitLead({
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '05551234567',
    message: 'Detaylı bilgi almak istiyorum',
    source: 'contact_form'
});
```

### Fotoğraf Yükle
```javascript
const file = document.getElementById('file-input').files[0];
const result = await SupabaseClient.uploadPropertyImage(file, propertyId);

if (result.success) {
    console.log('URL:', result.url);
}
```

---

## 📈 Performans İpuçları

### 1. Index'ler Kullanın
Migration script'te otomatik oluşturuldu:
- city, district, price üzerinde index
- Full-text search için GIN index

### 2. Materialized View'ler
```sql
-- İstatistikleri hızlandırır
SELECT * FROM property_stats_by_city;

-- Güncelle (günde 1 kez)
SELECT refresh_property_stats();
```

### 3. Connection Pooling
Supabase otomatik yönetir, ama yüksek trafikte:
- Settings > Database > Connection Pooling
- Mode: Transaction

### 4. CDN Kullanımı
Fotoğraflar otomatik olarak Supabase CDN üzerinden sunulur.

---

## 🚨 Sık Karşılaşılan Hatalar

### "Invalid API Key"
**Neden:** Yanlış veya eksik credentials
**Çözüm:** `supabase-client.js` dosyasında URL ve Key kontrolü

### "Permission Denied"
**Neden:** RLS policy izin vermiyor
**Çözüm:** Admin kullanıcısının `user_profiles` tablosunda kaydı var mı?

### "Storage Error"
**Neden:** Bucket public değil veya policy yok
**Çözüm:** Storage > bucket > Policies kontrol et

### "CORS Error"
**Neden:** Yanlış domain yapılandırması
**Çözüm:** Authentication > URL Configuration > Site URL ekle

---

## 📞 Yardım

### Dokümantasyon
- 📘 [SUPABASE_ARCHITECTURE.md](./SUPABASE_ARCHITECTURE.md) - Teknik detaylar
- 📗 [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) - Adım adım kurulum

### Kaynaklar
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Ref](https://supabase.com/docs/reference/javascript)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### Destek
- Email: admin@fokusemlak.com
- Supabase Discord: [discord.gg/supabase](https://discord.gg/supabase)

---

## 🎓 Öğrenme Yolu

### Başlangıç (Bu dokümandaki adımları takip et)
1. ✅ Supabase projesi oluştur
2. ✅ Database'i kur
3. ✅ Admin kullanıcısı oluştur
4. ✅ İlk ilanı ekle

### Orta Seviye
1. Frontend integration tamamla
2. Real-time features ekle
3. Custom RLS policies yaz
4. Edge Functions dene

### İleri Seviye
1. Performance optimization
2. Advanced analytics
3. Multi-tenant architecture
4. Mobile app geliştir

---

**⏱️ Toplam Kurulum Süresi:** ~5-10 dakika
**🔧 Zorluk Seviyesi:** Kolay-Orta
**💰 Maliyet:** Free tier başlangıç için yeterli

**Başarılar! 🎉**
