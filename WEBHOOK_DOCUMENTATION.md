# FOKUS Emlak Webhook Dokumentasyonu

Bu doküman, FOKUS Emlak web sitesi ve n8n otomasyon platformu arasındaki webhook entegrasyonlarını açıklamaktadır.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Webhook Endpoints](#webhook-endpoints)
   - [User Authentication Webhook](#1-user-authentication-webhook)
   - [Chatbot Inquiry Webhook](#2-chatbot-inquiry-webhook)
   - [Property View Tracking Webhook](#3-property-view-tracking-webhook)
3. [n8n Workflow Örnekleri](#n8n-workflow-örnekleri)
4. [Hata Yönetimi](#hata-yönetimi)
5. [Güvenlik](#güvenlik)

---

## Genel Bakış

FOKUS Emlak web sitesi, aşağıdaki olaylar için n8n'e webhook çağrıları yapar:

- Kullanıcı kaydı ve giriş işlemleri
- İlan ile ilgili chatbot soruları
- İlan görüntüleme istatistikleri

**n8n Base URL:** `https://n8n.fokusistatistik.com`

---

## Webhook Endpoints

### 1. User Authentication Webhook

**Endpoint:** `POST /webhook/user-auth`

**Açıklama:** Kullanıcı kaydı ve giriş işlemlerinde tetiklenir. Admin'e bildirim gönderilmesi ve kullanıcı takibi için kullanılır.

#### Tetiklenme Durumları
- Yeni kullanıcı kaydı (Google OAuth)
- Mevcut kullanıcı girişi

#### Request Payload

```json
{
  "event": "google_auth",
  "action": "signup" | "login",
  "google_user": {
    "id": "google_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "supabase_user_id": "uuid",
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "approval_status": "pending" | "approved" | "rejected",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Örnek Kullanım Senaryoları

**Senaryo 1: Yeni Kullanıcı Kaydı**
```json
{
  "event": "google_auth",
  "action": "signup",
  "google_user": {
    "id": "118234567890123456789",
    "email": "ahmet.yilmaz@gmail.com",
    "name": "Ahmet Yılmaz",
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ..."
  },
  "supabase_user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "profile": null,
  "timestamp": "2025-01-15T14:22:35Z"
}
```

**n8n İşlemleri:**
1. Admin'e email bildirimi gönder
2. Admin'e Slack/Discord bildirimi
3. Supabase'de kullanıcı kaydını tut
4. CRM sistemine kaydet (varsa)

**Senaryo 2: Onaylı Kullanıcı Girişi**
```json
{
  "event": "google_auth",
  "action": "login",
  "google_user": {
    "id": "118234567890123456789",
    "email": "ahmet.yilmaz@gmail.com",
    "name": "Ahmet Yılmaz",
    "picture": "https://lh3.googleusercontent.com/a/ACg8ocJ..."
  },
  "supabase_user_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "profile": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "full_name": "Ahmet Yılmaz",
    "email": "ahmet.yilmaz@gmail.com",
    "role": "user",
    "approval_status": "approved",
    "created_at": "2025-01-10T08:15:00Z"
  },
  "timestamp": "2025-01-15T14:22:35Z"
}
```

**n8n İşlemleri:**
1. Giriş logunu kaydet
2. Kullanıcı aktivite istatistiklerini güncelle
3. Son giriş zamanını güncelle

---

### 2. Chatbot Inquiry Webhook

**Endpoint:** `POST /webhook/chatbot-inquiry`

**Açıklama:** Kullanıcı bir ilan hakkında soru sorduğunda tetiklenir. Chatbot'a ilan bağlamı gönderilir.

#### Tetiklenme Durumları
- Kullanıcı ilan detay sayfasında "Soru Sor" butonuna tıkladığında

#### Request Payload

```json
{
  "event": "property_inquiry",
  "property": {
    "id": "property_id",
    "listing_code": "FK-2025-001",
    "title": "İzmit Merkez'de Satılık 3+1 Daire",
    "type": "satilik" | "kiralik",
    "price": 2500000,
    "area": 120,
    "rooms": "3+1",
    "location": "Yahyakaptan Mahallesi, İzmit",
    "url": "https://fokusemlak.com/listing-detail.html?id=123"
  },
  "user": {
    "id": "uuid" | null,
    "name": "Ahmet Yılmaz" | "Ziyaretçi",
    "authenticated": true | false
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Örnek Kullanım

**Senaryo: Kayıtlı Kullanıcı Soru Soruyor**
```json
{
  "event": "property_inquiry",
  "property": {
    "id": "123",
    "listing_code": "FK-2025-001",
    "title": "İzmit Merkez'de Satılık 3+1 Daire",
    "type": "satilik",
    "price": 2500000,
    "area": 120,
    "rooms": "3+1",
    "location": "Yahyakaptan Mahallesi, İzmit",
    "url": "https://fokusemlak.com/listing-detail.html?id=123"
  },
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Ahmet Yılmaz",
    "authenticated": true
  },
  "timestamp": "2025-01-15T16:45:22Z"
}
```

**n8n İşlemleri:**
1. Chatbot'a ilan bilgilerini gönder
2. Kullanıcı context'ini hazırla:
   ```
   Kullanıcı Ahmet Yılmaz, FK-2025-001 kodlu "İzmit Merkez'de Satılık 3+1 Daire"
   ilanı hakkında soru sormak istiyor.

   İlan Detayları:
   - Fiyat: ₺2.500.000
   - Alan: 120 m²
   - Oda: 3+1
   - Konum: Yahyakaptan Mahallesi, İzmit
   - Link: https://fokusemlak.com/listing-detail.html?id=123

   Kullanıcının sorularını bu ilan özelinde yanıtlayın.
   ```
3. Chatbot session'ı başlat
4. Inquiry'yi database'e kaydet (istatistik için)

**Senaryo: Misafir Kullanıcı Soru Soruyor**
```json
{
  "event": "property_inquiry",
  "property": {
    "id": "123",
    "listing_code": "FK-2025-001",
    "title": "İzmit Merkez'de Satılık 3+1 Daire",
    "type": "satilik",
    "price": 2500000,
    "area": 120,
    "rooms": "3+1",
    "location": "Yahyakaptan Mahallesi, İzmit",
    "url": "https://fokusemlak.com/listing-detail.html?id=123"
  },
  "user": {
    "id": null,
    "name": "Ziyaretçi",
    "authenticated": false
  },
  "timestamp": "2025-01-15T16:45:22Z"
}
```

**n8n İşlemleri:**
1. Misafir kullanıcı için chatbot session'ı başlat
2. Anonim kullanıcı istatistiğini tut
3. Chatbot'ta kayıt teşvik mesajı ekle

---

### 3. Property View Tracking Webhook

**Endpoint:** `POST /webhook/property/view`

**Açıklama:** Bir ilan görüntülendiğinde istatistik tutmak için tetiklenir.

#### Request Payload

```json
{
  "propertyId": "property_id",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Örnek Kullanım

```json
{
  "propertyId": "123",
  "timestamp": "2025-01-15T17:22:10Z"
}
```

**n8n İşlemleri:**
1. View counter'ı artır
2. Günlük/aylık view istatistiklerini güncelle
3. Popüler ilanları belirle
4. Admin dashboard için rapor hazırla

---

## n8n Workflow Örnekleri

### Workflow 1: Yeni Kullanıcı Kaydı Bildirimi

```
[Webhook Trigger: /webhook/user-auth]
    ↓
[Filter: action === "signup"]
    ↓
[Email Node: Admin'e bildirim]
    Subject: "🆕 Yeni Kullanıcı Kaydı"
    Body: "
        Yeni kullanıcı kaydı yapıldı:

        Ad: {{ $json.google_user.name }}
        Email: {{ $json.google_user.email }}
        Kayıt Zamanı: {{ $json.timestamp }}

        Onay için: https://fokusemlak.com/admin/supabase-admin.html
    "
    ↓
[Slack/Discord Node: Admin bildirimi]
    ↓
[Supabase Node: webhook_logs tablosuna kayıt]
```

### Workflow 2: Chatbot İlan Sorusu

```
[Webhook Trigger: /webhook/chatbot-inquiry]
    ↓
[Function Node: Context oluştur]
    return {
        context: `Kullanıcı ${$json.user.name}, ${$json.property.listing_code} kodlu
                  "${$json.property.title}" ilanı hakkında soru sormak istiyor.

                  İlan: ${$json.property.type} - ₺${$json.property.price}
                  Alan: ${$json.property.area} m² - ${$json.property.rooms}
                  Konum: ${$json.property.location}`,
        property: $json.property,
        user: $json.user
    }
    ↓
[OpenAI/ChatGPT Node: Chatbot'a gönder]
    System Prompt: "Sen FOKUS Emlak'ın yardımcı asistanısın.
                    Kullanıcıya ilan hakkında bilgi ver."
    Context: {{ $json.context }}
    ↓
[Supabase Node: Inquiry kaydı]
    Table: chatbot_inquiries
    Columns: property_id, user_id, timestamp
```

### Workflow 3: Haftalık İlan Görüntüleme Raporu

```
[Schedule Trigger: Her Pazar 09:00]
    ↓
[Supabase Node: Son 7 gün view istatistikleri]
    Query: "SELECT property_id, COUNT(*) as views
            FROM property_views
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY property_id
            ORDER BY views DESC
            LIMIT 10"
    ↓
[Function Node: Rapor formatla]
    ↓
[Email Node: Admin'e rapor]
    Subject: "📊 Haftalık İlan Görüntüleme Raporu"
    Body: Top 10 ilan listesi
```

---

## Hata Yönetimi

### Frontend Hata Yönetimi

Webhook çağrıları `try-catch` bloğu ile korunmalıdır:

```javascript
try {
    await fetch('https://n8n.fokusistatistik.com/webhook/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
} catch (error) {
    console.error('Webhook error:', error);
    // Kullanıcı deneyimini etkilemeden devam et
}
```

**Önemli:** Webhook hatası kullanıcı deneyimini etkilememeli. Webhook başarısız olsa bile:
- Kullanıcı giriş yapabilmeli
- Chatbot açılabilmeli
- İlan görüntülenebilmeli

### n8n Hata Yönetimi

n8n workflow'larında hata yönetimi:

1. **Webhook Node:** "Respond" modunu "Immediately" yap
2. **Error Workflow:** Hata durumunda log tut
3. **Retry Logic:** Network hataları için retry ekle
4. **Monitoring:** n8n'de execution history takibi

---

## Güvenlik

### 1. CORS (Cross-Origin Resource Sharing)

n8n webhook'ları CORS'a izin vermelidir:

```
Access-Control-Allow-Origin: https://fokusemlak.com
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type
```

### 2. Rate Limiting

Aşırı istek engellemek için:
- IP başına dakikada max 60 istek
- User ID başına dakikada max 10 chatbot inquiry

### 3. Payload Validation

n8n'de webhook payloadlarını validate et:

```javascript
// Function Node - Validation
if (!$json.event || !$json.timestamp) {
    throw new Error('Invalid payload: missing required fields');
}

if ($json.event === 'google_auth' && !$json.google_user) {
    throw new Error('Invalid payload: missing google_user');
}

return $json;
```

### 4. Webhook URL Gizliliği

- Webhook URL'leri environment variables'da sakla
- Frontend'de hardcode edilebilir (public endpoint)
- Hassas işlemler için API key eklenebilir

---

## Test Etme

### cURL ile Test

**User Auth Webhook:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook/user-auth \
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

**Chatbot Inquiry Webhook:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook/chatbot-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "event": "property_inquiry",
    "property": {
      "id": "123",
      "listing_code": "FK-2025-TEST",
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

**Property View Webhook:**
```bash
curl -X POST https://n8n.fokusistatistik.com/webhook/property/view \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "123",
    "timestamp": "2025-01-15T10:00:00Z"
  }'
```

---

## Gelecek Geliştirmeler

1. **Email Notifications:** Kullanıcıya otomatik email bildirimleri
2. **SMS Integration:** Kritik bildirimler için SMS
3. **WhatsApp Business API:** İlan bildirimleri WhatsApp üzerinden
4. **Analytics Dashboard:** Webhook istatistiklerini görselleştirme
5. **Webhook Signing:** HMAC signature ile güvenlik artırma

---

## İletişim

Webhook entegrasyonu ile ilgili sorularınız için:

- **Email:** info@fokusemlak.com
- **n8n Admin:** https://n8n.fokusistatistik.com
- **Teknik Doküman:** Bu dosya

---

**Son Güncelleme:** 2025-01-15
**Versiyon:** 1.0
**Hazırlayan:** FOKUS Emlak Teknik Ekip
