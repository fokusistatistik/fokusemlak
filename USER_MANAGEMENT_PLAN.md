# FOKUS Emlak - Kullanıcı Yönetim Sistemi

## 👥 Kullanıcı Tipleri

### 1. **Guest (Misafir)**
- İlanları görüntüleyebilir
- Blog okuyabilir
- Arama yapabilir
- Lead form doldurabilir
- **Yapamaz:** Favori, teklif, mesajlaşma

### 2. **Registered User (Kayıtlı Kullanıcı)**
- Guest yetkilerine ek olarak:
- ✅ Favori ilan ekleyebilir
- ✅ Aramaları kaydedebilir
- ✅ Teklif verebilir
- ✅ Emlakçı ile mesajlaşabilir
- ✅ Email bildirimleri alabilir
- ✅ Kendi ilanlarını görebilir

### 3. **Agent (Emlakçı)**
- Registered User yetkilerine ek olarak:
- ✅ Kendi ilanlarını ekleyebilir
- ✅ Kendi ilanlarını düzenleyebilir
- ✅ Müşteri mesajlarına cevap verebilir
- ✅ Lead'leri görüntüleyebilir (kendi ilanları için)
- ✅ Agent dashboard'a erişebilir
- ❌ Başkasının ilanını düzenleyemez

### 4. **Admin (Yönetici)**
- Tüm yetkilere sahip
- ✅ Tüm ilanları yönetir
- ✅ Kullanıcıları yönetir
- ✅ Blog yönetimi
- ✅ Sistem ayarları

---

## 🗄️ Yeni Database Tabloları

### 1. **user_profiles (Güncellenmiş)**
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,

  -- Basic Info
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,

  -- User Type
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),

  -- Agent Specific
  agency_name TEXT, -- Emlak ofisi adı
  license_number TEXT, -- Emlakçı lisans numarası
  agent_bio TEXT,
  agent_verified BOOLEAN DEFAULT false,

  -- Location
  city TEXT,
  district TEXT,

  -- Preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT false,

  -- Status
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  verified_email BOOLEAN DEFAULT false,
  verified_phone BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional
  notes TEXT -- Admin notes
);
```

### 2. **user_favorites (Favoriler)**
```sql
CREATE TABLE user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  notes TEXT, -- Kullanıcının notları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_property ON user_favorites(property_id);
```

### 3. **user_saved_searches (Kaydedilmiş Aramalar)**
```sql
CREATE TABLE user_saved_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Search Criteria
  search_name TEXT NOT NULL, -- "İzmit'te 3+1 Daireler"
  city TEXT,
  district TEXT,
  transaction_type TEXT,
  property_type TEXT,
  rooms TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  area_min NUMERIC,
  area_max NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,

  -- Notifications
  notify_on_match BOOLEAN DEFAULT true, -- Yeni ilan eşleştiğinde bildir
  last_notification_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON user_saved_searches(user_id);
```

### 4. **user_offers (Teklifler)**
```sql
CREATE TABLE user_offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Parties
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES auth.users(id), -- İlan sahibi emlakçı

  -- Offer Details
  offer_price NUMERIC NOT NULL,
  original_price NUMERIC NOT NULL, -- İlanın orijinal fiyatı
  message TEXT,
  financing_type TEXT CHECK (financing_type IN ('cash', 'mortgage', 'mixed')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired')),
  counter_offer_price NUMERIC, -- Karşı teklif
  counter_offer_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Additional
  admin_notes TEXT
);

CREATE INDEX idx_offers_user ON user_offers(user_id);
CREATE INDEX idx_offers_property ON user_offers(property_id);
CREATE INDEX idx_offers_agent ON user_offers(agent_id);
CREATE INDEX idx_offers_status ON user_offers(status);
```

### 5. **user_messages (Mesajlaşma)**
```sql
CREATE TABLE user_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Thread Management
  thread_id UUID NOT NULL, -- Aynı konuşmayı gruplamak için

  -- Parties
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- İlanla ilgiliyse

  -- Message
  subject TEXT,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'offer', 'system')),

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  archived_by_sender BOOLEAN DEFAULT false,
  archived_by_receiver BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON user_messages(thread_id);
CREATE INDEX idx_messages_sender ON user_messages(sender_id);
CREATE INDEX idx_messages_receiver ON user_messages(receiver_id);
CREATE INDEX idx_messages_property ON user_messages(property_id);
CREATE INDEX idx_messages_read ON user_messages(read);
```

### 6. **user_notifications (Bildirimler)**
```sql
CREATE TABLE user_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_property', 'price_change', 'new_message',
    'offer_received', 'offer_accepted', 'offer_rejected',
    'property_sold', 'system'
  )),

  -- Links
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  link_url TEXT,

  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_notifications_user ON user_notifications(user_id);
CREATE INDEX idx_notifications_read ON user_notifications(read);
CREATE INDEX idx_notifications_type ON user_notifications(type);
```

### 7. **user_property_views (Görüntüleme Geçmişi)**
```sql
CREATE TABLE user_property_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Engagement
  time_spent_seconds INTEGER DEFAULT 0,
  photos_viewed INTEGER DEFAULT 0,
  contacted BOOLEAN DEFAULT false
);

CREATE INDEX idx_property_views_user ON user_property_views(user_id);
CREATE INDEX idx_property_views_property ON user_property_views(property_id);
CREATE INDEX idx_property_views_date ON user_property_views(viewed_at);
```

---

## 🔐 Row Level Security (RLS) Policies

### user_profiles
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Public can view agent profiles (for listings)
CREATE POLICY "Public can view agent profiles"
ON user_profiles FOR SELECT
TO anon, authenticated
USING (role = 'agent' AND account_status = 'active');

-- Admins can view all
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### user_favorites
```sql
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
ON user_favorites FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```

### user_offers
```sql
-- Users can view their own offers
CREATE POLICY "Users can view own offers"
ON user_offers FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- Users can create offers
CREATE POLICY "Users can create offers"
ON user_offers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Agents can respond to offers
CREATE POLICY "Agents can update offers"
ON user_offers FOR UPDATE
TO authenticated
USING (auth.uid() = agent_id);
```

### user_messages
```sql
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
ON user_messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON user_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read
CREATE POLICY "Users can update message status"
ON user_messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id);
```

### user_notifications
```sql
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can mark notifications as read
CREATE POLICY "Users can update notification status"
ON user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

---

## 🎨 Frontend Pages

### 1. **login.html** (Giriş Sayfası)
- Email/password login
- Google OAuth
- "Beni hatırla" checkbox
- Şifremi unuttum linki
- Kayıt ol linki

### 2. **signup.html** (Kayıt Sayfası)
- Temel bilgiler (ad, email, telefon, şifre)
- Kullanıcı tipi seçimi (Kullanıcı / Emlakçı)
- Emlakçı ise: ofis adı, lisans no
- Terms & conditions checkbox
- Email doğrulama

### 3. **user-dashboard.html** (Kullanıcı Dashboard)
**Bölümler:**
- **Özet:** İstatistikler (favoriler, aramalar, teklifler)
- **Favorilerim:** Kaydedilmiş ilanlar
- **Kaydedilmiş Aramalar:** Otomatik bildirimler
- **Tekliflerim:** Teklif geçmişi ve durumları
- **Mesajlarım:** Emlakçılarla mesajlaşma
- **Bildirimler:** Sistem bildirimleri
- **Görüntüleme Geçmişi:** Son baktığım ilanlar
- **Profil Ayarları:** Bilgileri güncelleme

### 4. **agent-dashboard.html** (Emlakçı Dashboard)
**Bölümler:**
- **Özet:** İstatistikler (ilanlar, görüntülenme, teklifler)
- **İlanlarım:** CRUD işlemleri
- **Gelen Teklifler:** Teklifleri görüntüleme/yanıtlama
- **Mesajlar:** Müşterilerle mesajlaşma
- **Leadler:** İlanlarım için gelen leadler
- **Performans:** Analytics (görüntülenme, tıklanma)
- **Profil:** Agent profili düzenleme

### 5. **profile-settings.html** (Profil Ayarları)
- Kişisel bilgiler
- Şifre değiştirme
- Bildirim tercihleri
- Gizlilik ayarları
- Hesabı silme

---

## 🔧 JavaScript API Extensions

### User Authentication
```javascript
// Sign up
async signUp(email, password, userData) {
  const { data, error } = await this.client.auth.signUp({
    email,
    password,
    options: {
      data: userData // full_name, phone, role
    }
  });

  // Create profile
  if (data.user) {
    await this.createUserProfile(data.user.id, userData);
  }
}

// Sign in with provider
async signInWithGoogle() {
  await this.client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/user-dashboard.html`
    }
  });
}

// Password reset
async resetPassword(email) {
  await this.client.auth.resetPasswordForEmail(email);
}
```

### Favorites Management
```javascript
async addToFavorites(propertyId, notes = '') {
  const { data, error } = await this.client
    .from('user_favorites')
    .insert([{
      user_id: (await this.getSession()).user.id,
      property_id: propertyId,
      notes
    }]);
}

async removeFromFavorites(propertyId) {
  await this.client
    .from('user_favorites')
    .delete()
    .match({
      user_id: (await this.getSession()).user.id,
      property_id: propertyId
    });
}

async getFavorites() {
  const { data } = await this.client
    .from('user_favorites')
    .select('*, properties(*)')
    .eq('user_id', (await this.getSession()).user.id)
    .order('created_at', { ascending: false });

  return { success: true, data };
}
```

### Saved Searches
```javascript
async saveSearch(searchCriteria) {
  const { data, error } = await this.client
    .from('user_saved_searches')
    .insert([{
      user_id: (await this.getSession()).user.id,
      ...searchCriteria
    }]);
}

async getSavedSearches() {
  const { data } = await this.client
    .from('user_saved_searches')
    .select('*')
    .eq('user_id', (await this.getSession()).user.id);

  return { success: true, data };
}
```

### Offers
```javascript
async createOffer(propertyId, offerData) {
  const { data, error } = await this.client
    .from('user_offers')
    .insert([{
      user_id: (await this.getSession()).user.id,
      property_id: propertyId,
      ...offerData
    }]);
}

async getMyOffers() {
  const { data } = await this.client
    .from('user_offers')
    .select('*, properties(*)')
    .eq('user_id', (await this.getSession()).user.id)
    .order('created_at', { ascending: false });

  return { success: true, data };
}

async respondToOffer(offerId, response) {
  // Agent responds to offer
  const { data, error } = await this.client
    .from('user_offers')
    .update({
      status: response.status,
      counter_offer_price: response.counterPrice,
      counter_offer_message: response.message,
      responded_at: new Date().toISOString()
    })
    .eq('id', offerId);
}
```

### Messaging
```javascript
async sendMessage(receiverId, message, propertyId = null) {
  const threadId = this.generateThreadId(
    (await this.getSession()).user.id,
    receiverId
  );

  const { data, error } = await this.client
    .from('user_messages')
    .insert([{
      thread_id: threadId,
      sender_id: (await this.getSession()).user.id,
      receiver_id: receiverId,
      property_id: propertyId,
      message
    }]);
}

async getMessages(threadId = null) {
  let query = this.client
    .from('user_messages')
    .select('*, sender:sender_id(*), receiver:receiver_id(*)')
    .or(`sender_id.eq.${(await this.getSession()).user.id},receiver_id.eq.${(await this.getSession()).user.id}`);

  if (threadId) {
    query = query.eq('thread_id', threadId);
  }

  const { data } = await query.order('created_at', { ascending: true });
  return { success: true, data };
}
```

### Notifications
```javascript
async getNotifications(unreadOnly = false) {
  let query = this.client
    .from('user_notifications')
    .select('*')
    .eq('user_id', (await this.getSession()).user.id);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data } = await query.order('created_at', { ascending: false });
  return { success: true, data };
}

async markNotificationAsRead(notificationId) {
  await this.client
    .from('user_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
}
```

---

## 🎯 Kullanıcı Akışları

### Yeni Kullanıcı Kaydı
```
1. signup.html → Form doldur
2. Email doğrulama linki al
3. Email'i doğrula
4. login.html → Giriş yap
5. user-dashboard.html → Hoşgeldin ekranı
```

### İlan Favorilere Ekleme
```
1. listings.html veya listing-detail.html
2. "Favorilere Ekle" butonuna tıkla
3. Giriş yapmadıysa → login.html
4. Giriş yaptıysa → Favorilere ekle
5. Toast notification göster
```

### Teklif Verme
```
1. listing-detail.html → "Teklif Ver" butonu
2. Giriş kontrolü
3. Teklif formu modal'ı aç
4. Teklif miktarı ve mesaj gir
5. Gönder → user_offers tablosuna kaydet
6. Emlakçıya bildirim gönder
7. Email gönder (opsiyonel)
```

### Emlakçı Teklif Yanıtlama
```
1. agent-dashboard.html → Gelen Teklifler
2. Teklifi görüntüle
3. Kabul Et / Reddet / Karşı Teklif
4. Yanıtı kaydet
5. Kullanıcıya bildirim gönder
```

---

## 📧 Email Templates

### Welcome Email
```html
Hoşgeldiniz {name}!

FOKUS Emlak ailesine katıldığınız için teşekkür ederiz.

Artık şunları yapabilirsiniz:
✅ İlanları favorilere ekleyin
✅ Aramaları kaydedin
✅ Teklif verin
✅ Emlakçılarla mesajlaşın

[Dashboard'a Git]
```

### New Matching Property
```html
Merhaba {name},

Kaydedilmiş aramanız "{search_name}" için yeni bir ilan bulundu!

{property_title}
{property_location}
₺{property_price}

[İlanı Görüntüle]
```

### Offer Received (Agent)
```html
Yeni Teklif Aldınız!

İlan: {property_title}
Teklif: ₺{offer_price} (Liste: ₺{original_price})
Alıcı: {buyer_name}
Mesaj: {message}

[Teklifi Görüntüle]
```

---

## 🚀 Deployment Plan

### Phase 1: Database (1 gün)
1. ✅ user_profiles güncelle
2. ✅ 6 yeni tablo oluştur
3. ✅ RLS policies ekle
4. ✅ Indexes oluştur
5. ✅ Test data ekle

### Phase 2: API (2 gün)
1. ✅ supabase-client.js'i genişlet
2. ✅ Tüm CRUD fonksiyonları
3. ✅ Real-time subscriptions (opsiyonel)
4. ✅ Unit test

### Phase 3: Frontend (3-4 gün)
1. ✅ login.html oluştur
2. ✅ signup.html oluştur
3. ✅ user-dashboard.html oluştur
4. ✅ agent-dashboard.html oluştur
5. ✅ profile-settings.html oluştur
6. ✅ Mevcut sayfalara "Favorilere Ekle" ekle
7. ✅ Mevcut sayfalara "Teklif Ver" ekle

### Phase 4: Email & Notifications (1 gün)
1. ✅ Email templates
2. ✅ Notification system
3. ✅ Push notifications (opsiyonel)

### Phase 5: Testing (2 gün)
1. ✅ Manual testing
2. ✅ User acceptance testing
3. ✅ Performance testing
4. ✅ Security audit

**Toplam: ~8-10 gün**

---

## 💡 İleriye Dönük Özellikler

### Orta Vadeli
- 🔔 Real-time chat
- 📱 Mobile app (React Native)
- 🎥 Video chat ile tur
- 📊 Advanced analytics (user)
- ⭐ Rating & review system

### Uzun Vadeli
- 🤖 AI chatbot assistant
- 🏠 Virtual home staging
- 📈 Property price predictions
- 💰 Mortgage pre-approval integration
- 🔗 Government systems integration (tapu)

---

**Sonraki Adım:** Bu dosyaları oluşturayım mı?
1. ✅ user-management-migration.sql (yeni tablolar)
2. ✅ supabase-client-users.js (genişletilmiş API)
3. ✅ login.html + signup.html
4. ✅ user-dashboard.html
5. ✅ agent-dashboard.html
