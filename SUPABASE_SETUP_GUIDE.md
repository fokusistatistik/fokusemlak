# FOKUS Emlak - Supabase Kurulum Rehberi

Bu rehber, FOKUS Emlak projesini Supabase backend ile entegre etmek için adım adım talimatlar içerir.

## 📋 İçindekiler

1. [Supabase Projesi Oluşturma](#1-supabase-projesi-oluşturma)
2. [Database Schema Kurulumu](#2-database-schema-kurulumu)
3. [Storage Bucket Yapılandırması](#3-storage-bucket-yapılandırması)
4. [Authentication Kurulumu](#4-authentication-kurulumu)
5. [Admin Kullanıcısı Oluşturma](#5-admin-kullanıcısı-oluşturma)
6. [Frontend Entegrasyonu](#6-frontend-entegrasyonu)
7. [Test ve Doğrulama](#7-test-ve-doğrulama)
8. [Canlıya Alma](#8-canlıya-alma)

---

## 1. Supabase Projesi Oluşturma

### Adım 1.1: Supabase Hesabı Oluşturun
1. [https://supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub veya email ile kayıt olun

### Adım 1.2: Yeni Proje Oluşturun
1. Dashboard'da "New Project" butonuna tıklayın
2. Proje bilgilerini girin:
   - **Name:** fokus-emlak
   - **Database Password:** Güçlü bir şifre oluşturun (kaydedin!)
   - **Region:** Europe (Frankfurt veya en yakın)
   - **Pricing Plan:** Free tier (başlangıç için)
3. "Create new project" butonuna tıklayın
4. Proje hazırlanırken 2-3 dakika bekleyin

### Adım 1.3: API Bilgilerini Kaydedin
Proje hazır olduğunda:
1. Sol menüden **Settings > API** sekmesine gidin
2. Aşağıdaki bilgileri kopyalayın ve güvenli bir yerde saklayın:
   - **Project URL:** `https://xxxxxxxx.supabase.co`
   - **Anon Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (çok uzun)
   - **Service Role Key:** (Sadece backend için - GİZLİ!)

---

## 2. Database Schema Kurulumu

### Adım 2.1: SQL Editor'ü Açın
1. Sol menüden **SQL Editor** sekmesine gidin
2. "New query" butonuna tıklayın

### Adım 2.2: Migration Script'ini Çalıştırın
1. `supabase-migration.sql` dosyasını açın
2. **Tüm içeriği** kopyalayın
3. SQL Editor'e yapıştırın
4. Sağ alttaki **Run** (F5) butonuna tıklayın
5. Başarılı mesajı görene kadar bekleyin

### Adım 2.3: Tabloları Doğrulayın
1. Sol menüden **Table Editor** sekmesine gidin
2. Şu tabloların oluştuğunu kontrol edin:
   - ✅ properties
   - ✅ blogs
   - ✅ leads
   - ✅ categories
   - ✅ user_profiles

---

## 3. Storage Bucket Yapılandırması

### Adım 3.1: Property Images Bucket
1. Sol menüden **Storage** sekmesine gidin
2. "New bucket" butonuna tıklayın
3. Bucket ayarları:
   - **Name:** property-images
   - **Public bucket:** ✅ İşaretli
   - **File size limit:** 10 MB
   - **Allowed MIME types:**
     - image/jpeg
     - image/jpg
     - image/png
     - image/webp
4. "Create bucket" butonuna tıklayın

### Adım 3.2: Blog Images Bucket
1. Tekrar "New bucket" butonuna tıklayın
2. Bucket ayarları:
   - **Name:** blog-images
   - **Public bucket:** ✅ İşaretli
   - **File size limit:** 5 MB
   - **Allowed MIME types:** (yukarıdaki ile aynı)
3. "Create bucket" butonuna tıklayın

### Adım 3.3: Storage Policies (Otomatik)
Migration script ile otomatik oluşturuldu. Kontrol etmek için:
1. Bucket'a tıklayın
2. "Policies" sekmesine gidin
3. Şu policy'lerin olduğunu doğrulayın:
   - Public can view property images
   - Authenticated users can upload property images
   - Admins can delete property images

---

## 4. Authentication Kurulumu

### Adım 4.1: Email/Password Authentication'ı Etkinleştirin
1. Sol menüden **Authentication > Providers** sekmesine gidin
2. **Email** provider'ını bulun ve açın
3. Ayarlar:
   - **Enable Email provider:** ✅ İşaretli
   - **Confirm email:** ❌ İlk aşamada kapalı (test için)
   - **Secure email change:** ✅ İşaretli
4. "Save" butonuna tıklayın

### Adım 4.2: Google OAuth (Opsiyonel)
İlerleye Google ile giriş eklemek isterseniz:
1. **Google** provider'ını bulun ve açın
2. Google Cloud Console'dan OAuth credentials alın
3. Client ID ve Secret'ı girin
4. Authorized redirect URL'i ekleyin

### Adım 4.3: Site URL Yapılandırması
1. **Authentication > URL Configuration** sekmesine gidin
2. Ayarlar:
   - **Site URL:** `https://fokusemlak.com` (veya test için `http://localhost:5500`)
   - **Redirect URLs:**
     - `https://fokusemlak.com/admin/supabase-admin.html`
     - `http://localhost:5500/admin/supabase-admin.html` (development)

---

## 5. Admin Kullanıcısı Oluşturma

### Adım 5.1: İlk Admin Kullanıcısı
1. **Authentication > Users** sekmesine gidin
2. "Add user" butonuna tıklayın
3. Kullanıcı bilgilerini girin:
   - **Email:** admin@fokusemlak.com
   - **Password:** Güçlü bir şifre (kaydedin!)
   - **Auto Confirm User:** ✅ İşaretli
4. "Create user" butonuna tıklayın

### Adım 5.2: Admin Role Atama
1. **SQL Editor** sekmesine gidin
2. Şu komutu çalıştırın (user ID'yi değiştirin):

```sql
-- Önce user ID'yi bulun
SELECT id, email FROM auth.users WHERE email = 'admin@fokusemlak.com';

-- Çıkan ID'yi kullanarak profile oluşturun
INSERT INTO user_profiles (id, full_name, role)
VALUES (
  'BURAYA_USER_ID_YAPIŞTIRIN',
  'Admin',
  'admin'
);
```

3. Artık bu kullanıcı admin paneline giriş yapabilir!

---

## 6. Frontend Entegrasyonu

### Adım 6.1: Supabase Credentials Güncelleme
`/assets/js/supabase-client.js` dosyasını açın ve güncelleyin:

```javascript
const SupabaseClient = {
    config: {
        url: 'https://YOUR_PROJECT_ID.supabase.co', // Adım 1.3'ten
        anonKey: 'YOUR_ANON_KEY', // Adım 1.3'ten
    },
    // ...
};
```

### Adım 6.2: HTML Sayfalarına Supabase SDK Ekleme
Tüm sayfalara (index.html, listings.html, blog.html vb.) ekleyin:

```html
<!-- Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase Client -->
<script src="/assets/js/supabase-client.js"></script>
```

### Adım 6.3: listings.html'i Güncelleme
`listings.html` dosyasında, localStorage yerine Supabase kullanın:

```javascript
// Eski kod (kaldır):
// const properties = JSON.parse(localStorage.getItem('fokus_properties') || '[]');

// Yeni kod (ekle):
async function loadProperties() {
    const filters = {
        city: getQueryParam('city'),
        district: getQueryParam('district'),
        transaction_type: getQueryParam('operation'),
        property_type: getQueryParam('type'),
        rooms: getQueryParam('rooms'),
        priceMin: getQueryParam('priceMin'),
        priceMax: getQueryParam('priceMax')
    };

    const result = await SupabaseClient.fetchProperties(filters);

    if (result.success) {
        displayProperties(result.data);
    } else {
        console.error('Error loading properties:', result.error);
    }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', loadProperties);
```

### Adım 6.4: listing-detail.html'i Güncelleme
```javascript
async function loadPropertyDetail() {
    const slug = getQueryParam('slug');
    const result = await SupabaseClient.fetchPropertyBySlug(slug);

    if (result.success) {
        displayPropertyDetail(result.data);
    } else {
        window.location.href = '/listings.html';
    }
}

document.addEventListener('DOMContentLoaded', loadPropertyDetail);
```

### Adım 6.5: Lead Form Entegrasyonu
Tüm iletişim formlarını güncelleyin:

```javascript
async function submitContactForm(formData) {
    const result = await SupabaseClient.submitLead({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        source: 'contact_form',
        interest_type: 'general'
    });

    if (result.success) {
        showToast('Mesajınız başarıyla gönderildi!', 'success');
        // Form'u temizle
    } else {
        showToast('Bir hata oluştu: ' + result.error, 'error');
    }
}
```

---

## 7. Test ve Doğrulama

### Adım 7.1: Admin Panel Testi
1. Tarayıcıda `/admin/supabase-admin.html` sayfasını açın
2. Adım 5.1'de oluşturduğunuz admin kullanıcısı ile giriş yapın
3. Test işlemleri:
   - ✅ Yeni ilan oluşturma
   - ✅ İlan düzenleme
   - ✅ Fotoğraf yükleme
   - ✅ İlan silme
   - ✅ Blog yazısı oluşturma
   - ✅ Lead listesi görüntüleme

### Adım 7.2: Frontend Testi
1. Ana sayfayı açın: `/index.html`
2. Test senaryoları:
   - ✅ İlanlar listeleniyor mu?
   - ✅ Filtreleme çalışıyor mu?
   - ✅ İlan detay sayfası açılıyor mu?
   - ✅ Blog yazıları görünüyor mu?
   - ✅ İletişim formu gönderiliyor mu?

### Adım 7.3: Performance Kontrolü
1. Supabase Dashboard'da **Database > Performance** sekmesine gidin
2. Yavaş sorgular var mı kontrol edin
3. Index'lerin çalıştığını doğrulayın

---

## 8. Canlıya Alma

### Adım 8.1: Production Ayarları
1. **Authentication > Email Templates** - Email şablonlarını özelleştirin
2. **Authentication > URL Configuration** - Production URL'leri ekleyin
3. **Database > Backups** - Otomatik yedekleme ayarlayın

### Adım 8.2: Environment Variables
Hassas bilgileri environment variable'lara taşıyın:

```javascript
// .env dosyası (GİT'E EKLEMEYİN!)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

### Adım 8.3: Row Level Security Double Check
```sql
-- Tüm tabloların RLS'i açık mı?
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Tüm sonuçlar 't' (true) olmalı
```

### Adım 8.4: Monitoring Kurulumu
1. **Project Settings > Integrations** - Hata izleme (opsiyonel)
2. **Database > Database Settings** - Connection pooling ayarları
3. Slack/Discord webhook'ları kurun (opsiyonel)

---

## 🎯 Sonraki Adımlar

### Kısa Vadeli (1-2 Hafta)
- [ ] İlk 10-20 gerçek ilanı ekleyin
- [ ] Blog içeriklerini ekleyin
- [ ] Test kullanıcılarından geri bildirim alın
- [ ] SEO ayarlarını optimize edin

### Orta Vadeli (1-2 Ay)
- [ ] Real-time özelliklerini aktif edin (yeni ilan bildirimleri)
- [ ] Edge Functions ile otomasyon ekleyin
- [ ] Advanced analytics ekleyin
- [ ] Mobile app geliştirin (opsiyonel)

### Uzun Vadeli (3+ Ay)
- [ ] AI-powered fiyat tahmini
- [ ] Virtual tour integration
- [ ] WhatsApp Business API entegrasyonu
- [ ] CRM sistemi entegrasyonu

---

## 📊 Performans Metrikleri

### Supabase Limits (Free Tier)
- **Database Size:** 500 MB
- **File Storage:** 1 GB
- **Bandwidth:** 2 GB/month
- **Monthly Active Users:** 50,000

### Upgrade Zamanı Geldi mi?
Şu durumlarda Pro plan ($25/month) değerlendirebilirsiniz:
- İlan sayısı > 500
- Aylık ziyaretçi > 10,000
- Storage > 1 GB
- Günlük lead > 50

---

## 🆘 Sorun Giderme

### Problem: "Invalid API Key" Hatası
**Çözüm:**
- `supabase-client.js` dosyasında URL ve Key'leri kontrol edin
- Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)

### Problem: "Row Level Security Error"
**Çözüm:**
- Admin kullanıcısının `user_profiles` tablosunda kaydı var mı?
- RLS policy'leri doğru çalışıyor mu test edin

### Problem: Fotoğraflar Yüklenmiyor
**Çözüm:**
- Storage bucket'ların public olduğunu kontrol edin
- Dosya boyutu limitlerini kontrol edin
- CORS ayarlarını kontrol edin

### Problem: Yavaş Sorgular
**Çözüm:**
- Index'lerin oluştuğunu doğrulayın
- `EXPLAIN ANALYZE` ile sorgu planını inceleyin
- Gereksiz JOIN'leri kaldırın

---

## 📚 Kaynaklar

- [Supabase Resmi Dokümantasyon](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [FOKUS Emlak GitHub Repository](https://github.com/YOUR_REPO)

---

## 💬 Destek

Sorularınız için:
- **Email:** admin@fokusemlak.com
- **Supabase Discord:** [discord.gg/supabase](https://discord.gg/supabase)
- **GitHub Issues:** Proje repository'sinde issue açın

---

**Son Güncelleme:** 2025-11-24
**Versiyon:** 1.0.0
**Yazar:** FOKUS İstatistik & Claude AI
