# FOKUS Emlak Webhook Kurulum Rehberi

Bu rehber, FOKUS Emlak webhook sisteminin kurulumu için adım adım talimatlar içerir.

## 🎯 Genel Bakış

Bu sistemde **3 webhook endpoint** kurulacak:

1. **User Authentication** (`/webhook/user-auth`) - Kullanıcı giriş/kayıt
2. **Chatbot Inquiry** (`/webhook/chatbot-inquiry`) - İlan soruları
3. **Property View Tracking** (`/webhook/property/view`) - İlan görüntüleme

---

## 📋 Ön Gereksinimler

- ✅ n8n hesabı (https://n8n.fokusistatistik.com)
- ✅ Supabase projesi aktif
- ✅ Email hesabı (SMTP erişimi)
- ⚙️ (Opsiyonel) Slack workspace
- ⚙️ (Opsiyonel) OpenAI API key (chatbot için)

---

## 🚀 Kurulum Adımları

### 1️⃣ n8n Workflow'larını İçe Aktar

**a. n8n'e giriş yapın:**
```
https://n8n.fokusistatistik.com
```

**b. Her workflow için:**
1. Sol menüden **"Workflows"** seçin
2. Sağ üstten **"Add workflow"** → **"Import from file"**
3. `n8n-workflow-examples.json` dosyasından workflow'ları import edin

**Import edilecek 3 workflow:**
- ✅ FOKUS Emlak - User Authentication Handler
- ✅ FOKUS Emlak - Chatbot Inquiry Handler
- ✅ FOKUS Emlak - Weekly Property Analytics

---

### 2️⃣ Credential'ları Ayarla

#### 📧 Email (SMTP)

1. n8n'de **Settings** → **Credentials** → **Add Credential**
2. **"SMTP"** seçin
3. Bilgileri girin:

```yaml
Name: FOKUS Emlak Email
User: noreply@fokusemlak.com
Password: [email_password]
Host: smtp.gmail.com  # veya kullandığınız SMTP
Port: 587
SSL/TLS: Enable STARTTLS
```

**Gmail kullanıyorsanız:**
- 2-factor authentication aktif olmalı
- App-specific password oluşturun: https://myaccount.google.com/apppasswords

#### 🗄️ Supabase

1. **Add Credential** → **"Supabase"**
2. Bilgileri girin:

```yaml
Name: FOKUS Emlak Supabase
Host: your-project.supabase.co
Service Role Key: [supabase_service_role_key]
```

**Service Role Key nereden alınır:**
1. Supabase Dashboard → Project Settings
2. API → **service_role** (secret key)
3. ⚠️ Bu key'i güvenli tutun!

#### 💬 Slack (Opsiyonel)

1. **Add Credential** → **"Slack OAuth2"**
2. OAuth akışını takip edin
3. Workspace'inize erişim verin
4. **Channel:** `#genel` veya uygun kanal seçin

#### 🤖 OpenAI (Chatbot için)

1. **Add Credential** → **"OpenAI"**
2. API key girin:

```yaml
Name: OpenAI Chatbot
API Key: sk-...your_key...
```

**API Key nereden alınır:**
- https://platform.openai.com/api-keys
- **Not:** GPT-4 kullanımı için ödeme gerekli

---

### 3️⃣ Webhook URL'lerini Al ve Test Et

#### User Auth Webhook

1. **"User Authentication Handler"** workflow'unu aç
2. **"Webhook - User Auth"** node'una tıkla
3. **"Test URL"** kopyala:
   ```
   https://n8n.fokusistatistik.com/webhook-test/user-auth
   ```
4. Production URL:
   ```
   https://n8n.fokusistatistik.com/webhook/user-auth
   ```

**Test komutu:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook-test/user-auth \
  -H "Content-Type: application/json" \
  -d '{
    "event": "google_auth",
    "action": "signup",
    "google_user": {
      "id": "test123",
      "email": "test@example.com",
      "name": "Test User",
      "picture": "https://via.placeholder.com/150"
    },
    "supabase_user_id": "test-uuid",
    "timestamp": "2025-01-15T10:00:00Z"
  }'
```

**Başarılı test:**
- ✅ Admin'e email geldi
- ✅ Slack'te mesaj görüldü (Slack aktifse)
- ✅ n8n'de execution başarılı

#### Chatbot Inquiry Webhook

**Test URL:**
```
https://n8n.fokusistatistik.com/webhook-test/chatbot-inquiry
```

**Production URL:**
```
https://n8n.fokusistatistik.com/webhook/chatbot-inquiry
```

**Test komutu:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook-test/chatbot-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "event": "property_inquiry",
    "property": {
      "id": "123",
      "listing_code": "FK-2025-001",
      "title": "Test İlan",
      "type": "satilik",
      "price": 1000000,
      "area": 100,
      "rooms": "2+1",
      "location": "İzmit",
      "url": "https://fokusemlak.com/test"
    },
    "user": {
      "id": "test-user",
      "name": "Test Kullanıcı",
      "authenticated": true
    },
    "timestamp": "2025-01-15T10:00:00Z"
  }'
```

#### Property View Webhook

**Production URL:**
```
https://n8n.fokusistatistik.com/webhook/property/view
```

**Test komutu:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook/property/view \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "123",
    "timestamp": "2025-01-15T10:00:00Z"
  }'
```

---

### 4️⃣ Workflow'ları Aktif Et

Her workflow için:

1. Workflow'u aç
2. Sağ üstte **"Inactive"** → **"Active"** yap
3. ✅ Yeşil işaret göreceksiniz

**Kontrol listesi:**
- ✅ User Authentication Handler → **Active**
- ✅ Chatbot Inquiry Handler → **Active**
- ✅ Weekly Property Analytics → **Active**

---

### 5️⃣ Frontend Kodlarını Güncelle (ÖNEMLİ!)

⚠️ **Test URL'lerini Production URL'lere çevirin!**

#### auth-callback.html

Değiştir:
```javascript
// TEST
const webhookUrl = 'https://n8n.fokusistatistik.com/webhook-test/user-auth';

// PRODUCTION
const webhookUrl = 'https://n8n.fokusistatistik.com/webhook/user-auth';
```

#### listing-detail.html

Değiştir:
```javascript
// TEST
const webhookUrl = 'https://n8n.fokusistatistik.com/webhook-test/chatbot-inquiry';

// PRODUCTION
const webhookUrl = 'https://n8n.fokusistatistik.com/webhook/chatbot-inquiry';
```

---

## 🧪 Test Senaryoları

### Senaryo 1: Yeni Kullanıcı Kaydı

1. Chrome Incognito açın
2. `https://fokusemlak.com/login.html`
3. **"Google ile Devam Et"** tıklayın
4. Yeni bir Google hesabı ile giriş yapın

**Beklenen sonuçlar:**
- ✅ `pending-approval.html` sayfası açıldı
- ✅ Admin'e email geldi: "🆕 Yeni Kullanıcı Kaydı"
- ✅ Kullanıcıya welcome email geldi
- ✅ Slack'te bildirim görüldü (varsa)
- ✅ n8n execution log'da başarılı kayıt

### Senaryo 2: İlan Hakkında Soru Sor

1. `https://fokusemlak.com/listings.html`
2. Herhangi bir ilana tıklayın
3. **"Soru Sor" (💬)** butonuna tıklayın

**Beklenen sonuçlar:**
- ✅ "Chatbot açılıyor..." toast mesajı göründü
- ✅ Chatbot açıldı (veya yeni tab)
- ✅ n8n'de inquiry log'landı
- ✅ Context hazırlandı

### Senaryo 3: Favorilere Ekle

1. İlan detay sayfasında
2. **"Favorilere Ekle" (❤️)** tıklayın
3. Giriş yapın (gerekirse)

**Beklenen sonuçlar:**
- ✅ "Favorilere eklendi!" toast
- ✅ Buton "Favorilerimde" oldu (kırmızı)
- ✅ `user-dashboard.html` → Favorilerim'de görünüyor

### Senaryo 4: Paylaş

1. İlan detay sayfasında
2. **"Paylaş" (📤)** tıklayın

**Beklenen sonuçlar:**
- ✅ Mobil: Native share dialog açıldı
- ✅ Desktop: "İlan linki kopyalandı!" toast

---

## 📊 Monitoring & Logs

### n8n Execution Logs

1. n8n Dashboard → **"Executions"**
2. Her webhook çağrısını göreceksiniz:
   - ✅ Yeşil: Başarılı
   - ❌ Kırmızı: Hata
   - ⏸️ Gri: Bekleniyor

**Hata durumunda:**
1. Execution'a tıklayın
2. Hangi node'da hata olduğunu görün
3. Error mesajını okuyun
4. Credential'ları kontrol edin

### Supabase Logs

**webhook_logs tablosu:**
```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**chatbot_inquiries tablosu:**
```sql
SELECT
  ci.*,
  up.full_name,
  up.email
FROM chatbot_inquiries ci
LEFT JOIN user_profiles up ON ci.user_id = up.id
ORDER BY ci.created_at DESC;
```

**property_views istatistikleri:**
```sql
SELECT
  property_id,
  COUNT(*) as view_count,
  DATE(created_at) as date
FROM property_views
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY property_id, DATE(created_at)
ORDER BY view_count DESC;
```

---

## 🔧 Sorun Giderme

### Webhook çalışmıyor

**Kontrol listesi:**
1. ✅ Workflow aktif mi? (n8n'de "Active")
2. ✅ Credential'lar doğru mu?
3. ✅ Frontend'de doğru URL kullanılıyor mu?
4. ✅ CORS problemi var mı? (Browser console)
5. ✅ Network tabi: n8n erişilebilir mi?

**Test:**
```bash
curl -I https://n8n.fokusistatistik.com/webhook/user-auth
```

Beklenen: `200 OK` veya `405 Method Not Allowed` (GET yerine POST gerekli)

### Email gelmiyor

1. ✅ SMTP credential'ları doğru mu?
2. ✅ Email spam'de mi?
3. ✅ n8n execution log'da hata var mı?
4. ✅ Test email gönder:
   ```
   n8n → Email node → "Execute Node"
   ```

### Supabase'e yazılmıyor

1. ✅ Service Role Key doğru mu?
2. ✅ Tablo isimleri doğru mu?
3. ✅ RLS (Row Level Security) kapalı mı service role için?

**RLS kontrol:**
```sql
-- Service role'ün RLS bypass ettiğini doğrula
SELECT * FROM information_schema.table_privileges
WHERE grantee = 'service_role';
```

---

## 🎨 Özelleştirme

### Email Şablonlarını Değiştir

n8n workflow'unda Email node'u düzenleyin:

```javascript
// Subject
Yeni Kullanıcı Kaydı - {{$json.google_user.name}}

// Body (HTML veya Text)
Merhaba Admin,

{{$json.google_user.name}} adlı kullanıcı kaydoldu.

Email: {{$json.google_user.email}}
Zaman: {{$json.timestamp}}

[Onaylamak için tıklayın](https://fokusemlak.com/admin)
```

### Slack Mesajlarını Değiştir

Slack node'da mesaj formatını düzenleyin:

```
🆕 *Yeni Kullanıcı*

*Ad:* {{$json.google_user.name}}
*Email:* {{$json.google_user.email}}

<https://fokusemlak.com/admin|Admin Panel>
```

### Chatbot Prompt'unu Değiştir

OpenAI node'da System message'ı düzenleyin:

```
Sen FOKUS Emlak'ın yardımcı asistanısın.

Görevin:
- Emlak ilanları hakkında bilgi vermek
- Profesyonel ve dostça olmak
- Türkçe konuşmak
- Yanlış bilgi vermekten kaçınmak

Kullanıcıya her zaman iletişim bilgilerini sunabilirsin:
Tel: (0262) 555 12 34
Email: info@fokusemlak.com
```

---

## 📈 İleri Seviye

### WhatsApp Business API Entegrasyonu

n8n'de **WhatsApp Business** node ekleyerek:
- Yeni kullanıcı kaydında WhatsApp bildirimi
- İlan sorularına WhatsApp'tan cevap
- Favori ilanda fiyat değişikliği bildirimi

### SMS Entegrasyonu (Twilio)

n8n'de **Twilio** node ile:
- Acil bildirimleri SMS ile gönder
- 2FA için SMS doğrulama
- İlan appointment hatırlatıcıları

### Webhook Signing (Güvenlik)

```javascript
// Frontend'de HMAC signature
const crypto = require('crypto');
const secret = 'your-webhook-secret';
const payload = JSON.stringify(data);
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature
  },
  body: payload
});
```

```javascript
// n8n'de signature doğrulama
const crypto = require('crypto');
const secret = 'your-webhook-secret';
const receivedSignature = $node["Webhook"].json.headers['x-webhook-signature'];
const payload = JSON.stringify($node["Webhook"].json.body);
const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

---

## ✅ Kurulum Tamamlandı!

Başarılı kurulum sonrası:

- ✅ 3 webhook endpoint aktif
- ✅ Email bildirimleri çalışıyor
- ✅ Chatbot inquiry sistemi hazır
- ✅ İstatistik takibi aktif
- ✅ Haftalık raporlar gönderiliyor

---

## 📞 Destek

Sorun yaşıyorsanız:

1. **Dokümanları tekrar okuyun:**
   - `WEBHOOK_DOCUMENTATION.md` - Detaylı webhook açıklamaları
   - `n8n-workflow-examples.json` - Workflow şablonları

2. **n8n loglarını kontrol edin:**
   - Executions → Son çalıştırmalar
   - Error mesajlarını okuyun

3. **İletişim:**
   - Email: info@fokusemlak.com
   - n8n URL: https://n8n.fokusistatistik.com

---

**Son Güncelleme:** 2025-01-15
**Versiyon:** 1.0
**Hazırlayan:** FOKUS Emlak Teknik Ekip
