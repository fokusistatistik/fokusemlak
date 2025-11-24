# FOKUS Emlak - Revize Edilmiş Sistem Mimarisi

## 🎯 Temel Değişiklikler

### ❌ Kaldırılanlar:
- Email/password authentication
- Kayıt formu (ad, soyad, telefon vs.)
- Agent rolü
- Mesajlaşma sistemi
- Teklif sistemi

### ✅ Eklenecekler:
- **Sadece Google OAuth** authentication
- **Webhook bazlı kayıt/giriş** (n8n)
- **Admin onay sistemi** (kullanıcı aktifleştirme)
- **İlan detayında 3 buton:**
  - Favorilere Ekle ❤️
  - Paylaş 📤
  - Soru Sor 💬 (Chatbot'a ilan no ile)

---

## 🔐 Yeni Authentication Akışı

### Login/Signup Flow (Tek Buton):

```
┌─────────────────────────────────────────────┐
│         "Google ile Devam Et"               │
│              (Tek Buton)                     │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│       Google OAuth Doğrulama                │
│   (Google hesabı seçimi ve izin)            │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│           Webhook'a Gönder                  │
│      n8n.fokusistatistik.com/user-auth      │
└─────────────────┬───────────────────────────┘
                  │
          ┌───────┴────────┐
          │                │
    [Yeni Kullanıcı]   [Mevcut Kullanıcı]
          │                │
          ↓                ↓
┌──────────────────┐  ┌──────────────────┐
│ Supabase Kayıt   │  │ Durum Kontrolü   │
│ + Email Gönder   │  │                  │
│ (Admin'e bildir) │  │ ✅ Onaylı mı?    │
│                  │  │ ⏸️ Beklemede mi? │
│ Status: pending  │  │ ❌ Reddedildi mi?│
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         ↓                     ↓
┌──────────────────────────────────────────┐
│           Kullanıcıya Mesaj              │
├──────────────────────────────────────────┤
│ Yeni: "Kaydınız alındı. Admin onayı      │
│        bekleniyor. Email ile             │
│        bilgilendirileceksiniz."          │
│                                          │
│ Onaylı: "Hoşgeldiniz! → Dashboard"      │
│                                          │
│ Beklemede: "Hesabınız henüz             │
│            onaylanmadı. Lütfen bekleyin" │
│                                          │
│ Reddedildi: "Hesabınız erişim için      │
│             uygun değil"                 │
└──────────────────────────────────────────┘
```

---

## 🗄️ Database Değişiklikleri

### user_profiles Tablosu Güncelleme:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_picture TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_google_id ON user_profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);
```

### Webhook Log Tablosu (Opsiyonel):

```sql
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'user_auth', 'chatbot_inquiry'
  payload JSONB,
  user_id UUID REFERENCES auth.users(id),
  response JSONB,
  status TEXT, -- 'success', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔗 Webhook Endpoints

### 1. User Authentication Webhook
**Endpoint:** `https://n8n.fokusistatistik.com/webhook/user-auth`

**Request (Frontend → n8n):**
```json
{
  "event": "google_auth",
  "google_user": {
    "id": "google_user_123",
    "email": "user@gmail.com",
    "name": "Ahmet Yılmaz",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "timestamp": "2025-11-24T10:30:00Z"
}
```

**Response (n8n → Frontend):**
```json
{
  "success": true,
  "action": "login" | "signup" | "pending" | "rejected",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "Ahmet Yılmaz",
    "role": "user",
    "approval_status": "approved" | "pending" | "rejected"
  },
  "message": "Hoşgeldiniz!" | "Kayıt alındı, onay bekleniyor" | "Hesabınız erişim için uygun değil",
  "supabase_session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### 2. Chatbot Inquiry Webhook
**Endpoint:** `https://n8n.fokusistatistik.com/webhook/chatbot-inquiry`

**Request (İlan Detay → Chatbot):**
```json
{
  "event": "property_inquiry",
  "property": {
    "id": "uuid",
    "listing_code": "FE-123456",
    "title": "İzmit'te 3+1 Daire",
    "price": 4500000,
    "city": "Kocaeli",
    "district": "İzmit"
  },
  "user": {
    "id": "uuid",
    "name": "Ahmet Yılmaz",
    "email": "user@gmail.com"
  },
  "initial_message": "Bu ilan hakkında bilgi almak istiyorum",
  "timestamp": "2025-11-24T10:30:00Z"
}
```

**Response (n8n → Chatbot):**
```json
{
  "success": true,
  "chatbot_url": "https://chatbot.fokusistatistik.com/chat?session=xyz&property=FE-123456",
  "context_message": "FE-123456 kodlu ilan hakkında size nasıl yardımcı olabilirim?"
}
```

---

## 📄 İlan Detay Sayfası Butonları

### listing-detail.html'e Eklenecek 3 Buton:

```html
<!-- Action Buttons -->
<div class="flex flex-wrap gap-3 mb-6">
    <!-- 1. Favorilere Ekle -->
    <button onclick="handleFavoriteClick()" id="favorite-btn"
            class="flex-1 px-6 py-3 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition font-bold">
        <i class="fa-solid fa-heart mr-2" id="favorite-icon"></i>
        <span id="favorite-text">Favorilere Ekle</span>
    </button>

    <!-- 2. Paylaş -->
    <button onclick="handleShareClick()"
            class="flex-1 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition font-bold">
        <i class="fa-solid fa-share-nodes mr-2"></i>
        Paylaş
    </button>

    <!-- 3. Soru Sor (Chatbot) -->
    <button onclick="handleAskQuestion()"
            class="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-bold">
        <i class="fa-solid fa-comments mr-2"></i>
        Soru Sor
    </button>
</div>
```

### JavaScript Fonksiyonları:

```javascript
// 1. Favorilere Ekle
async function handleFavoriteClick() {
    // Giriş kontrolü
    const { session } = await SupabaseClient.getSession();
    if (!session) {
        showToast('Favorilere eklemek için giriş yapmalısınız', 'warning');
        setTimeout(() => window.location.href = '/login.html', 1500);
        return;
    }

    const propertyId = getCurrentPropertyId();
    const isFavorited = await checkIfFavorited(propertyId);

    if (isFavorited) {
        // Favorilerden kaldır
        const result = await SupabaseClient.removeFromFavorites(propertyId);
        if (result.success) {
            showToast('Favorilerden kaldırıldı', 'success');
            updateFavoriteButton(false);
        }
    } else {
        // Favorilere ekle
        const result = await SupabaseClient.addToFavorites(propertyId);
        if (result.success) {
            showToast('Favorilere eklendi!', 'success');
            updateFavoriteButton(true);
        }
    }
}

// 2. Paylaş
function handleShareClick() {
    const propertyData = getCurrentPropertyData();
    const shareUrl = window.location.href;
    const shareText = `${propertyData.title} - ₺${propertyData.price.toLocaleString('tr-TR')}`;

    // Native Share API (mobile)
    if (navigator.share) {
        navigator.share({
            title: propertyData.title,
            text: shareText,
            url: shareUrl
        }).catch(() => showShareModal(shareUrl, shareText));
    } else {
        // Desktop: Modal ile sosyal medya paylaşımı
        showShareModal(shareUrl, shareText);
    }
}

// Share Modal
function showShareModal(url, text) {
    const modal = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="share-modal">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4">Paylaş</h3>

                <div class="grid grid-cols-4 gap-3 mb-4">
                    <a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}"
                       target="_blank" class="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100">
                        <i class="fa-brands fa-whatsapp text-2xl text-green-600"></i>
                        <span class="text-xs">WhatsApp</span>
                    </a>

                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}"
                       target="_blank" class="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
                        <i class="fa-brands fa-facebook text-2xl text-blue-600"></i>
                        <span class="text-xs">Facebook</span>
                    </a>

                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}"
                       target="_blank" class="flex flex-col items-center gap-2 p-3 bg-sky-50 rounded-lg hover:bg-sky-100">
                        <i class="fa-brands fa-twitter text-2xl text-sky-600"></i>
                        <span class="text-xs">Twitter</span>
                    </a>

                    <button onclick="copyToClipboard('${url}')"
                            class="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                        <i class="fa-solid fa-copy text-2xl text-slate-600"></i>
                        <span class="text-xs">Kopyala</span>
                    </button>
                </div>

                <button onclick="document.getElementById('share-modal').remove()"
                        class="w-full py-2 bg-slate-200 rounded-lg hover:bg-slate-300">
                    Kapat
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

// 3. Soru Sor (Chatbot)
async function handleAskQuestion() {
    const propertyData = getCurrentPropertyData();

    // Webhook'a gönder
    const webhookUrl = 'https://n8n.fokusistatistik.com/webhook/chatbot-inquiry';

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'property_inquiry',
                property: {
                    id: propertyData.id,
                    listing_code: propertyData.listing_code,
                    title: propertyData.title,
                    price: propertyData.price,
                    city: propertyData.city,
                    district: propertyData.district
                },
                user: await getCurrentUserInfo(),
                initial_message: `${propertyData.listing_code} kodlu ilan hakkında bilgi almak istiyorum`,
                timestamp: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            // Chatbot'u aç
            openChatbot(result.chatbot_url, propertyData);
        } else {
            showToast('Chatbot başlatılamadı', 'error');
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        // Fallback: Direkt chatbot'u aç
        openChatbot(null, propertyData);
    }
}

// Chatbot'u Aç
function openChatbot(chatbotUrl, propertyData) {
    // Mevcut chatbot implementasyonunu kullan
    // Ama ilan bilgisini context olarak ekle

    if (window.FokusChatbot) {
        window.FokusChatbot.open({
            propertyCode: propertyData.listing_code,
            initialMessage: `${propertyData.listing_code} kodlu "${propertyData.title}" ilanı hakkında bilgi almak istiyorum`
        });
    } else {
        // External chatbot URL varsa
        if (chatbotUrl) {
            window.open(chatbotUrl, 'chatbot', 'width=400,height=600');
        } else {
            showToast('Chatbot şu anda kullanılamıyor', 'warning');
        }
    }
}
```

---

## 🔄 login.html Revizesi

### Yeni login.html (Sadece Google Auth):

```html
<div class="bg-white rounded-2xl shadow-xl p-8">
    <h2 class="text-2xl font-bold text-slate-900 mb-6 text-center">
        Devam Etmek İçin Giriş Yapın
    </h2>

    <p class="text-slate-600 text-center mb-8">
        FOKUS Emlak'ta favori ilanlarınızı kaydedin, bildirimleri takip edin ve daha fazlasını keşfedin.
    </p>

    <!-- Google Auth Button -->
    <button onclick="handleGoogleAuth()" id="google-auth-btn"
            class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 py-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm">
        <svg class="w-6 h-6" viewBox="0 0 24 24">
            <!-- Google icon SVG -->
        </svg>
        <span>Google ile Devam Et</span>
    </button>

    <!-- Info -->
    <p class="text-xs text-slate-500 text-center mt-6">
        Devam ederek <a href="/terms.html" class="text-blue-600">Kullanım Koşulları</a>'nı
        ve <a href="/privacy.html" class="text-blue-600">Gizlilik Politikası</a>'nı kabul etmiş olursunuz.
    </p>

    <!-- Features -->
    <div class="mt-8 pt-6 border-t border-slate-200">
        <p class="text-sm font-medium text-slate-700 mb-4">Giriş yaparak:</p>
        <ul class="space-y-3 text-sm text-slate-600">
            <li class="flex items-center gap-2">
                <i class="fa-solid fa-check text-green-600"></i>
                Favori ilanlarınızı kaydedebilirsiniz
            </li>
            <li class="flex items-center gap-2">
                <i class="fa-solid fa-check text-green-600"></i>
                Yeni ilanlardan haberdar olabilirsiniz
            </li>
            <li class="flex items-center gap-2">
                <i class="fa-solid fa-check text-green-600"></i>
                İlanlar hakkında soru sorabilirsiniz
            </li>
        </ul>
    </div>
</div>
```

### JavaScript (Webhook Entegrasyonu):

```javascript
async function handleGoogleAuth() {
    const btn = document.getElementById('google-auth-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Google ile bağlanılıyor...';

    try {
        // 1. Google OAuth ile kimlik doğrula
        const { data, error } = await SupabaseClient.client.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth-callback.html`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;

        // OAuth redirect olacak, callback'te webhook çağrılacak
    } catch (error) {
        console.error('Google auth error:', error);
        showToast('Google ile giriş başarısız: ' + error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Google ile Devam Et';
    }
}
```

---

## 📄 Auth Callback Sayfası

### auth-callback.html (Yeni):

```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Giriş Yapılıyor...</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/assets/js/supabase-client.js"></script>
</head>
<body>
    <div style="display: flex; align-items: center; justify-center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center;">
            <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: #333; font-size: 18px;">Giriş yapılıyor, lütfen bekleyin...</p>
        </div>
    </div>

    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>

    <script>
    (async () => {
        try {
            // 1. Get session from URL hash
            const { data: { session }, error } = await SupabaseClient.client.auth.getSession();

            if (error || !session) {
                throw new Error('Oturum bulunamadı');
            }

            // 2. Get Google user info
            const googleUser = session.user.user_metadata;

            // 3. Send to webhook for user verification/creation
            const webhookUrl = 'https://n8n.fokusistatistik.com/webhook/user-auth';

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'google_auth',
                    google_user: {
                        id: googleUser.sub,
                        email: googleUser.email,
                        name: googleUser.full_name || googleUser.name,
                        picture: googleUser.avatar_url || googleUser.picture
                    },
                    supabase_user_id: session.user.id,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            // 4. Handle response
            if (result.success) {
                if (result.action === 'login' && result.user.approval_status === 'approved') {
                    // Onaylı kullanıcı - dashboard'a yönlendir
                    window.location.href = '/user-dashboard.html';
                } else if (result.action === 'signup' || result.user.approval_status === 'pending') {
                    // Yeni kayıt veya onay bekliyor
                    window.location.href = '/pending-approval.html';
                } else if (result.user.approval_status === 'rejected') {
                    // Reddedilmiş
                    window.location.href = '/access-denied.html';
                }
            } else {
                throw new Error(result.message || 'Webhook hatası');
            }
        } catch (error) {
            console.error('Auth callback error:', error);
            alert('Giriş işlemi başarısız: ' + error.message);
            window.location.href = '/login.html';
        }
    })();
    </script>
</body>
</html>
```

---

## 👨‍💼 Admin Panel Güncelleme

### Admin Panel'e Kullanıcı Onay Bölümü:

```html
<!-- admin/supabase-admin.html'e eklenecek tab -->
<button onclick="AdminPanel.switchTab('users')" data-tab="users"
        class="tab-button px-6 py-4 font-medium text-slate-600 hover:text-blue-900">
    <i class="fa-solid fa-users mr-2"></i> Kullanıcı Onayları
</button>

<!-- Users Tab -->
<div id="users-tab" class="tab-content p-6">
    <h2 class="text-xl font-bold text-slate-900 mb-4">Kullanıcı Onay İstekleri</h2>

    <div id="pending-users-list" class="space-y-4">
        <!-- Pending users will be loaded here -->
    </div>
</div>
```

### JavaScript:

```javascript
async loadPendingUsers() {
    const { data, error } = await this.client
        .from('user_profiles')
        .select('*, auth.users(*)')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
        document.getElementById('pending-users-list').innerHTML = `
            <p class="text-center text-slate-500 py-8">
                Onay bekleyen kullanıcı yok
            </p>
        `;
        return;
    }

    const container = document.getElementById('pending-users-list');
    container.innerHTML = data.map(user => `
        <div class="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <img src="${user.google_picture || '/assets/images/avatar-placeholder.png'}"
                     class="w-12 h-12 rounded-full">
                <div>
                    <p class="font-bold text-slate-900">${user.full_name}</p>
                    <p class="text-sm text-slate-600">${user.google_email}</p>
                    <p class="text-xs text-slate-400">
                        Kayıt: ${new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </p>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="AdminPanel.approveUser('${user.id}')"
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fa-solid fa-check mr-1"></i> Onayla
                </button>
                <button onclick="AdminPanel.rejectUser('${user.id}')"
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <i class="fa-solid fa-times mr-1"></i> Reddet
                </button>
            </div>
        </div>
    `).join('');
}

async approveUser(userId) {
    if (!confirm('Bu kullanıcıyı onaylamak istediğinizden emin misiniz?')) return;

    const { error } = await this.client
        .from('user_profiles')
        .update({
            approval_status: 'approved',
            approved_by: (await this.client.auth.getUser()).data.user.id,
            approved_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (!error) {
        alert('Kullanıcı onaylandı!');
        this.loadPendingUsers();
        // Email gönder (webhook)
        this.sendApprovalEmail(userId, 'approved');
    }
}
```

---

## 📧 Email Notifications

### Webhook'tan Gönderilecek Emailler:

**1. Kayıt Onayı Bekleniyor:**
```
Konu: FOKUS Emlak - Kaydınız Alındı

Merhaba [İsim],

FOKUS Emlak'a kaydınız başarıyla alındı. Hesabınız yönetici onayı bekliyor.

Onaylandığında email ile bilgilendirileceksiniz.

Teşekkürler,
FOKUS Emlak Ekibi
```

**2. Kayıt Onaylandı:**
```
Konu: FOKUS Emlak - Hesabınız Aktif! 🎉

Merhaba [İsim],

Hesabınız onaylandı! Artık FOKUS Emlak'ı kullanmaya başlayabilirsiniz.

[Giriş Yap]

FOKUS Emlak Ekibi
```

**3. Kayıt Reddedildi:**
```
Konu: FOKUS Emlak - Kayıt Hakkında

Merhaba [İsim],

Üzgünüz, hesabınız onaylanmadı.

Daha fazla bilgi için: info@fokusemlak.com

FOKUS Emlak Ekibi
```

---

## ✅ Yapılacaklar Listesi

### 1. Database (30 dk):
- [ ] user_profiles tablosuna yeni kolonlar ekle
- [ ] webhook_logs tablosu oluştur
- [ ] İndexleri ekle

### 2. login.html Revize (1 saat):
- [ ] Email/password formunu kaldır
- [ ] Sadece Google Auth butonu bırak
- [ ] Webhook entegrasyonu ekle
- [ ] auth-callback.html oluştur
- [ ] pending-approval.html oluştur
- [ ] access-denied.html oluştur

### 3. listing-detail.html (1 saat):
- [ ] 3 buton ekle (Favori, Paylaş, Soru Sor)
- [ ] JavaScript fonksiyonları yaz
- [ ] Share modal ekle
- [ ] Chatbot entegrasyonu

### 4. n8n Webhook (2-3 saat):
- [ ] user-auth endpoint oluştur
- [ ] chatbot-inquiry endpoint oluştur
- [ ] Email notification flow
- [ ] Error handling

### 5. Admin Panel (1 saat):
- [ ] Kullanıcı onay tab'ı ekle
- [ ] Approve/reject fonksiyonları
- [ ] Email trigger

**Toplam Süre: ~6-8 saat**

---

Devam edelim mi? Hangi bölümü önce uygulamaya başlayalım?
