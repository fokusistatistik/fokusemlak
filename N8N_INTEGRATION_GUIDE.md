# n8n Webhook Entegrasyon Rehberi

Bu dokümantasyon, FOKUS Emlak projesinin backend entegrasyonunu n8n üzerinden gerçekleştirmek için gerekli webhook'ları ve veri yapılarını detaylı olarak açıklar.

## 📋 İçindekiler

1. [Genel Bilgiler](#genel-bilgiler)
2. [Kimlik Doğrulama Endpoint'leri](#kimlik-doğrulama-endpointleri)
3. [Emlak İşlemleri](#emlak-i̇şlemleri)
4. [AI Araçları](#ai-araçları)
5. [Lead ve İletişim](#lead-ve-i̇letişim)
6. [Veri ve İçerik](#veri-ve-i̇çerik)
7. [Hata Yönetimi](#hata-yönetimi)
8. [Güvenlik](#güvenlik)

---

## Genel Bilgiler

### Base URL
```
https://n8n.fokusistatistik.com
```

### Ortak Başlıklar
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token} // Gerektiğinde
```

### Standart Yanıt Formatı

**Başarılı Yanıt:**
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

**Hata Yanıtı:**
```json
{
  "success": false,
  "error": "Hata mesajı",
  "code": "ERROR_CODE"
}
```

---

## Kimlik Doğrulama Endpoint'leri

### 1. Kullanıcı Kaydı
**Endpoint:** `POST /webhook/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "Ahmet Yılmaz",
  "phone": "+905551234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123456",
    "email": "user@example.com",
    "name": "Ahmet Yılmaz",
    "token": "jwt_token_here"
  },
  "message": "Kayıt başarılı"
}
```

**n8n Workflow Önerisi:**
1. Email formatını doğrula
2. Mevcut kullanıcı kontrolü yap
3. Şifreyi hash'le (bcrypt)
4. Veritabanına kaydet
5. JWT token oluştur
6. Hoşgeldin email'i gönder
7. CRM'e kayıt et

---

### 2. Kullanıcı Girişi
**Endpoint:** `POST /webhook/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "usr_123456",
    "email": "user@example.com",
    "name": "Ahmet Yılmaz",
    "avatar": "https://...",
    "token": "jwt_token_here",
    "favorites": ["prop_123", "prop_456"]
  }
}
```

**n8n Workflow:**
1. Email ile kullanıcıyı bul
2. Şifre doğrulaması yap
3. JWT token oluştur
4. Kullanıcı bilgilerini döndür
5. Login logunu kaydet

---

### 3. Google OAuth
**Endpoint:** `POST /webhook/auth/google`

**Request Body:**
```json
{
  "idToken": "google_id_token",
  "email": "user@gmail.com",
  "name": "Ahmet Yılmaz",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Response:** (Aynı login response formatı)

**n8n Workflow:**
1. Google ID token'ı doğrula (Google API)
2. Email ile kullanıcı ara
3. Yoksa yeni kullanıcı oluştur
4. JWT token oluştur
5. Kullanıcı bilgilerini döndür

---

### 4. Çıkış
**Endpoint:** `POST /webhook/auth/logout`

**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Çıkış başarılı"
}
```

---

## Emlak İşlemleri

### 1. İlan Arama
**Endpoint:** `POST /webhook/property/search`

**Request Body:**
```json
{
  "city": "Kocaeli",
  "district": "İzmit",
  "propertyType": "daire",
  "listingType": "satilik",
  "minPrice": 1000000,
  "maxPrice": 5000000,
  "minArea": 80,
  "maxArea": 150,
  "rooms": "3+1",
  "page": 1,
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "prop_123",
        "title": "İzmit Merkezde 3+1 Daire",
        "price": 2500000,
        "location": {
          "city": "Kocaeli",
          "district": "İzmit",
          "neighborhood": "Yahyakaptan"
        },
        "details": {
          "area": 120,
          "rooms": "3+1",
          "floor": 5,
          "buildingAge": 3
        },
        "images": ["url1", "url2", "url3"],
        "thumbnail": "url",
        "createdAt": "2024-11-20T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8
    }
  }
}
```

**n8n Workflow:**
1. Parametreleri parse et
2. Database sorgusu oluştur (filtrelerle)
3. Sayfalama uygula
4. Görsel URL'lerini oluştur
5. Sonuçları döndür

---

### 2. İlan Detay
**Endpoint:** `GET /webhook/property/get/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prop_123",
    "title": "İzmit Merkezde 3+1 Daire",
    "description": "Detaylı açıklama...",
    "price": 2500000,
    "priceHistory": [
      {"date": "2024-11-01", "price": 2600000},
      {"date": "2024-11-15", "price": 2500000}
    ],
    "location": {
      "city": "Kocaeli",
      "district": "İzmit",
      "neighborhood": "Yahyakaptan",
      "address": "Tam adres",
      "coordinates": {
        "lat": 40.7654,
        "lng": 29.9402
      }
    },
    "details": {
      "area": 120,
      "rooms": "3+1",
      "floor": 5,
      "totalFloors": 8,
      "buildingAge": 3,
      "bathrooms": 2,
      "heating": "Kombi",
      "furnished": false
    },
    "features": [
      "Asansör",
      "Otopark",
      "Güvenlik",
      "Balkon"
    ],
    "images": ["url1", "url2", "url3", "url4"],
    "virtualTour": "https://...",
    "agent": {
      "id": "agent_456",
      "name": "Mehmet Demir",
      "phone": "+905551234567",
      "email": "mehmet@fokusemlak.com",
      "avatar": "https://..."
    },
    "views": 245,
    "createdAt": "2024-11-20T10:00:00Z",
    "updatedAt": "2024-11-23T15:30:00Z"
  }
}
```

**n8n Workflow:**
1. İlan ID ile database'den çek
2. Görüntülenme sayısını artır (async)
3. İlişkili danışman bilgilerini ekle
4. Tam detayları döndür

---

### 3. Tüm İlanlar
**Endpoint:** `GET /webhook/property/all?page=1&limit=20`

**Response:** (Arama endpoint'i ile aynı format)

---

## AI Araçları

### 1. Mülk Değerleme
**Endpoint:** `POST /webhook/ai/valuation`

**Request Body:**
```json
{
  "location": {
    "city": "Kocaeli",
    "district": "İzmit",
    "neighborhood": "Yahyakaptan"
  },
  "propertyType": "daire",
  "area": 120,
  "rooms": "3+1",
  "floor": 5,
  "buildingAge": 3,
  "features": ["asansör", "otopark"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedPrice": 2500000,
    "priceRange": {
      "min": 2300000,
      "max": 2700000
    },
    "pricePerSquareMeter": 20833,
    "marketAnalysis": {
      "averageAreaPrice": 21000,
      "trend": "stable", // "rising", "falling", "stable"
      "confidence": 0.85
    },
    "comparableProperties": [
      {
        "id": "prop_789",
        "price": 2450000,
        "area": 115,
        "similarity": 0.92
      }
    ],
    "factors": [
      {"name": "Konum", "impact": "+5%"},
      {"name": "Bina Yaşı", "impact": "-3%"},
      {"name": "Kat", "impact": "+2%"}
    ],
    "reportUrl": "https://n8n.fokusistatistik.com/reports/val_123.pdf",
    "validUntil": "2024-12-24T23:59:59Z"
  }
}
```

**n8n Workflow:**
1. Input validasyonu
2. Benzer ilanları database'den çek
3. AI hesaplama yap (OpenAI/Custom model)
4. Pazar verilerini entegre et
5. PDF rapor oluştur
6. Lead kaydı oluştur
7. Sonuçları döndür

---

### 2. Sanal Tadilat
**Endpoint:** `POST /webhook/ai/renovation`

**Request Body:**
```json
{
  "imageUrl": "https://...",
  "renovationType": "modern", // "modern", "klasik", "minimal"
  "rooms": ["salon", "mutfak"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "beforeImage": "https://...",
    "afterImage": "https://...",
    "estimatedCost": 150000,
    "processingTime": 8500, // ms
    "improvements": [
      "Duvar boyası",
      "Zemin değişimi",
      "Aydınlatma"
    ]
  }
}
```

**n8n Workflow:**
1. Görsel URL'sini indir
2. AI görsel işleme (Midjourney API/Stable Diffusion)
3. Before/After görselleri kaydet (S3/Storage)
4. Maliyet hesapla
5. Sonuçları döndür

---

## Lead ve İletişim

### 1. Lead Formu
**Endpoint:** `POST /webhook/lead/submit`

**Request Body:**
```json
{
  "type": "property_inquiry", // "valuation", "property_inquiry", "general"
  "propertyId": "prop_123", // opsiyonel
  "name": "Ahmet Yılmaz",
  "phone": "+905551234567",
  "email": "ahmet@example.com",
  "message": "Bu ilan hakkında detaylı bilgi almak istiyorum",
  "source": "website", // "website", "mobile_app", "whatsapp"
  "utmParams": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "izmit-daire"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leadId": "lead_123",
    "trackingCode": "TR-2024-88",
    "message": "Talebiniz alınmıştır. En kısa sürede dönüş yapılacaktır."
  }
}
```

**n8n Workflow:**
1. Form validasyonu
2. Lead database'e kaydet
3. Tracking kodu oluştur
4. CRM'e ilet (Hubspot/Salesforce)
5. Müşteriye onay SMS/Email gönder
6. İlgili danışmana bildirim gönder
7. Slack/Teams bildirimi
8. Lead skoru hesapla

---

### 2. Mülk Sat/Kirala
**Endpoint:** `POST /webhook/property/sell`

**Request Body:**
```json
{
  "ownerInfo": {
    "name": "Ayşe Demir",
    "phone": "+905551234567",
    "email": "ayse@example.com"
  },
  "property": {
    "type": "daire",
    "listingType": "satilik",
    "location": {
      "city": "Kocaeli",
      "district": "İzmit",
      "neighborhood": "Yahyakaptan",
      "address": "Tam adres"
    },
    "details": {
      "area": 120,
      "rooms": "3+1",
      "floor": 5,
      "buildingAge": 3
    },
    "desiredPrice": 2500000
  },
  "availableForVisit": "2024-11-25T14:00:00Z",
  "notes": "Ek notlar"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "req_789",
    "trackingCode": "TR-2024-89",
    "estimatedValuation": 2450000,
    "nextSteps": [
      "Danışman ataması yapılacak",
      "Yerinde inceleme planlanacak",
      "Fotoğraf çekimi yapılacak"
    ],
    "message": "Talebiniz başarıyla alındı. 24 saat içinde bir danışman sizinle iletişime geçecektir."
  }
}
```

**n8n Workflow:**
1. Form validasyonu
2. Hızlı AI değerleme yap
3. Database'e kaydet
4. Müsait danışman bul ve ata
5. Randevu oluştur
6. Mülk sahibine onay email/SMS
7. Danışmana atama bildirimi
8. CRM'e kayıt
9. Google Calendar entegrasyonu

---

### 3. İletişim Formu
**Endpoint:** `POST /webhook/contact/submit`

**Request Body:**
```json
{
  "name": "Can Öztürk",
  "email": "can@example.com",
  "phone": "+905551234567",
  "subject": "Genel Bilgi",
  "message": "Hizmetleriniz hakkında detaylı bilgi almak istiyorum"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mesajınız alındı. En kısa sürede dönüş yapılacaktır."
}
```

**n8n Workflow:**
1. Spam kontrolü
2. Database'e kaydet
3. Müşteri hizmetlerine email ilet
4. Otomatik yanıt email gönder
5. Ticket sistemi entegrasyonu

---

### 4. Bülten Kaydı
**Endpoint:** `POST /webhook/newsletter/subscribe`

**Request Body:**
```json
{
  "email": "user@example.com",
  "preferences": {
    "city": "Kocaeli",
    "propertyTypes": ["daire", "villa"],
    "priceRange": "1M-3M"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bültene kaydınız tamamlandı"
}
```

**n8n Workflow:**
1. Email validasyonu
2. Duplicate kontrolü
3. Database'e kaydet
4. Email servisine ekle (Mailchimp/SendGrid)
5. Hoşgeldin email gönder
6. Tercihlerini kaydet

---

### 5. Süreç Sorgulama
**Endpoint:** `GET /webhook/tracker/:code`

**Örnek:** `GET /webhook/tracker/TR-2024-88`

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingCode": "TR-2024-88",
    "type": "property_inquiry",
    "status": "in_progress", // "received", "in_progress", "completed"
    "createdAt": "2024-11-20T10:00:00Z",
    "updatedAt": "2024-11-22T14:30:00Z",
    "timeline": [
      {
        "date": "2024-11-20T10:00:00Z",
        "status": "received",
        "description": "Talebiniz alındı"
      },
      {
        "date": "2024-11-21T09:15:00Z",
        "status": "assigned",
        "description": "Danışman atandı: Mehmet Demir"
      },
      {
        "date": "2024-11-22T14:30:00Z",
        "status": "contacted",
        "description": "Sizinle iletişime geçildi"
      }
    ],
    "assignedAgent": {
      "name": "Mehmet Demir",
      "phone": "+905551234567",
      "email": "mehmet@fokusemlak.com"
    },
    "nextAction": "Emlak gezisi planlanıyor",
    "estimatedCompletion": "2024-11-25"
  }
}
```

---

## Veri ve İçerik

### 1. Pazar Verileri
**Endpoint:** `GET /webhook/data/market?city=Kocaeli`

**Response:**
```json
{
  "success": true,
  "data": {
    "city": "Kocaeli",
    "date": "2024-11-24",
    "averagePricePerSqm": 28500,
    "priceChange": {
      "daily": 0.2,
      "weekly": 1.2,
      "monthly": 3.5,
      "yearly": 15.8
    },
    "totalListings": 1850,
    "districts": [
      {
        "name": "İzmit",
        "avgPrice": 28500,
        "change": 1.2,
        "listings": 650
      },
      {
        "name": "Gebze",
        "avgPrice": 25000,
        "change": 0.8,
        "listings": 480
      }
    ],
    "rentalYield": {
      "average": 4.2,
      "trend": "stable"
    },
    "mortgageRate": 3.05
  }
}
```

**n8n Workflow:**
1. Cache kontrolü (1 saat)
2. Database'den güncel verileri çek
3. İstatistikleri hesapla
4. Değişim oranlarını hesapla
5. Cache'e kaydet
6. Sonuçları döndür

---

### 2. Isı Haritası
**Endpoint:** `GET /webhook/data/heatmap?city=Kocaeli&type=price`

**Response:**
```json
{
  "success": true,
  "data": {
    "city": "Kocaeli",
    "type": "price",
    "zones": [
      {
        "coordinates": {
          "lat": 40.7654,
          "lng": 29.9402
        },
        "value": 28500,
        "intensity": 0.85,
        "neighborhood": "Yahyakaptan"
      }
    ],
    "legend": {
      "min": 15000,
      "max": 35000,
      "unit": "TL/m²"
    },
    "generatedAt": "2024-11-24T10:00:00Z"
  }
}
```

---

### 3. Blog Yazıları
**Endpoint:** `GET /webhook/blog/all?page=1&limit=10&category=deprem`

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "blog_123",
        "slug": "deprem-sonrasi-ev-almak",
        "title": "Deprem Sonrası Ev Alırken Dikkat Edilmesi Gerekenler",
        "excerpt": "Kısa özet...",
        "category": "deprem",
        "author": {
          "name": "Dr. Ali Veli",
          "avatar": "https://..."
        },
        "thumbnail": "https://...",
        "publishedAt": "2024-11-20T10:00:00Z",
        "readTime": 8
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

### 4. Blog Detay
**Endpoint:** `GET /webhook/blog/get/:slug`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "blog_123",
    "slug": "deprem-sonrasi-ev-almak",
    "title": "Deprem Sonrası Ev Alırken Dikkat Edilmesi Gerekenler",
    "content": "<html content>",
    "category": "deprem",
    "tags": ["deprem", "güvenlik", "bina"],
    "author": {
      "name": "Dr. Ali Veli",
      "bio": "Yazar biyografisi",
      "avatar": "https://..."
    },
    "thumbnail": "https://...",
    "publishedAt": "2024-11-20T10:00:00Z",
    "updatedAt": "2024-11-21T14:00:00Z",
    "readTime": 8,
    "views": 1250,
    "relatedPosts": [
      {
        "id": "blog_456",
        "title": "İlgili yazı",
        "slug": "ilgili-yazi"
      }
    ]
  }
}
```

---

## Hata Yönetimi

### Hata Kodları

| Kod | Açıklama |
|-----|----------|
| `VALIDATION_ERROR` | Geçersiz input |
| `AUTH_FAILED` | Kimlik doğrulama başarısız |
| `NOT_FOUND` | Kaynak bulunamadı |
| `DUPLICATE_ENTRY` | Mükerrer kayıt |
| `RATE_LIMIT_EXCEEDED` | Çok fazla istek |
| `SERVER_ERROR` | Sunucu hatası |
| `EXTERNAL_API_ERROR` | Dış servis hatası |

### Örnek Hata Yanıtları

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Geçersiz email formatı",
  "code": "VALIDATION_ERROR",
  "fields": {
    "email": "Geçerli bir email adresi giriniz"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Geçersiz token",
  "code": "AUTH_FAILED"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "İlan bulunamadı",
  "code": "NOT_FOUND"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Çok fazla istek. Lütfen 60 saniye sonra tekrar deneyin",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Sunucu hatası oluştu",
  "code": "SERVER_ERROR",
  "requestId": "req_xyz789"
}
```

---

## Güvenlik

### 1. Rate Limiting
- **Endpoint başına:** 100 istek/dakika
- **IP başına:** 500 istek/dakika
- **Kullanıcı başına:** 1000 istek/saat

### 2. CORS Ayarları
```javascript
Access-Control-Allow-Origin: https://fokusemlak.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 3. Input Validation
- Email format kontrolü
- Telefon numarası formatı (Türkiye)
- XSS koruması (HTML sanitization)
- SQL injection koruması
- Dosya yükleme validasyonu

### 4. JWT Token
- **Algoritma:** HS256
- **Süre:** 24 saat
- **Refresh token:** 30 gün
- **Payload örneği:**
```json
{
  "userId": "usr_123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 5. Veri Şifreleme
- Şifreler: bcrypt (salt rounds: 10)
- Hassas veriler: AES-256
- HTTPS zorunlu (production)

### 6. Webhook Güvenliği
- IP whitelist
- Request signature verification
- Timestamp validation (5 dakika tolerance)

---

## Test Endpoint'leri

### Health Check
```
GET /webhook/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-24T10:00:00Z",
  "version": "1.0.0"
}
```

### Test Data Reset (Sadece Development)
```
POST /webhook/test/reset
```

---

## Performans Önerileri

1. **Caching:**
   - Pazar verileri: 1 saat
   - Blog listesi: 30 dakika
   - İlan detayı: 15 dakika

2. **Pagination:**
   - Default limit: 20
   - Max limit: 100

3. **Database İndeksleri:**
   - `properties.city, district`
   - `properties.price, area`
   - `users.email`
   - `leads.trackingCode`

4. **Asenkron İşlemler:**
   - Email gönderimi
   - Push notifications
   - Görüntülenme sayısı güncelleme
   - Log yazma

---

## Monitoring ve Logging

### Log Formatı
```json
{
  "timestamp": "2024-11-24T10:00:00Z",
  "level": "info",
  "endpoint": "/webhook/property/search",
  "method": "POST",
  "statusCode": 200,
  "responseTime": 145,
  "userId": "usr_123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### İzlenecek Metrikler
- Response time (ortalama, p95, p99)
- Error rate
- Throughput (req/sec)
- Cache hit rate
- Database query time

---

## Örnek n8n Workflow Yapıları

### Lead Workflow
```
1. HTTP Request (Trigger)
2. Validate Input
3. Check Duplicate (Database)
4. Generate Tracking Code
5. Save to Database
6. [Split Branch]
   - Send SMS (Twilio)
   - Send Email (SendGrid)
   - Notify Slack
   - Update CRM (Hubspot)
7. Return Response
```

### Valuation Workflow
```
1. HTTP Request (Trigger)
2. Validate Input
3. Get Comparable Properties (Database)
4. Calculate with AI (OpenAI)
5. Get Market Data
6. Generate PDF Report
7. Upload to S3
8. Create Lead Record
9. Send Email with Report
10. Return Response
```

---

## Katkıda Bulunanlar

Bu dokümantasyon Claude AI ile oluşturulmuştur.

**Son Güncelleme:** 24 Kasım 2024
**Versiyon:** 1.0.0
