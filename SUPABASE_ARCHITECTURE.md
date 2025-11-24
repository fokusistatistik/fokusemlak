# FOKUS Emlak - Supabase Architecture Documentation

## 📋 Overview

Complete Supabase backend infrastructure for FOKUS Emlak real estate platform supporting:
- Property listings management
- Blog content management
- Lead generation & tracking
- User authentication & authorization
- Media storage & CDN delivery
- Real-time updates (optional)

---

## 🗄️ Database Schema

### 1. **Properties Table**
Stores all real estate listings with comprehensive details.

```sql
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  listing_code TEXT UNIQUE NOT NULL,

  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Satılık', 'Kiralık')),
  property_type TEXT NOT NULL CHECK (property_type IN ('Daire', 'Villa', 'Arsa', 'İşyeri', 'Ofis')),

  -- Location
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Pricing
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'TRY',
  price_per_sqm NUMERIC,

  -- Property Details
  rooms TEXT, -- e.g., "3+1", "4+2"
  area_gross NUMERIC, -- m²
  area_net NUMERIC, -- m²
  building_age INTEGER,
  floor_number INTEGER,
  total_floors INTEGER,

  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '[]'::jsonb,
  -- Example: ["Asansör", "Otopark", "Güvenlik", "Havuz"]

  -- Media
  photos TEXT[] DEFAULT '{}', -- Array of Supabase Storage URLs
  video_url TEXT,
  virtual_tour_url TEXT,

  -- Status & Visibility
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'pending', 'draft')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  urgent BOOLEAN DEFAULT false,

  -- SEO
  slug TEXT UNIQUE,
  meta_description TEXT,
  meta_keywords TEXT[],

  -- Analytics
  view_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Additional
  notes TEXT,
  admin_notes TEXT -- Internal notes, not public
);

-- Indexes for performance
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_transaction ON properties(transaction_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_published ON properties(published);
CREATE INDEX idx_properties_featured ON properties(featured);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_properties_slug ON properties(slug);

-- Full-text search index
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));
```

### 2. **Blogs Table**
Manages all blog content with rich text support.

```sql
CREATE TABLE blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Content
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL, -- HTML content
  excerpt TEXT,

  -- Media
  cover_image TEXT, -- Supabase Storage URL
  cover_image_alt TEXT,

  -- Author
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_bio TEXT,

  -- Categorization
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- SEO
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT[],

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Additional
  notes TEXT
);

-- Indexes
CREATE INDEX idx_blogs_category ON blogs(category);
CREATE INDEX idx_blogs_published ON blogs(published);
CREATE INDEX idx_blogs_featured ON blogs(featured);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_search ON blogs USING gin(to_tsvector('turkish', title || ' ' || COALESCE(content, '')));
```

### 3. **Leads Table**
Captures all lead generation forms.

```sql
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Contact Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Lead Source
  source TEXT NOT NULL CHECK (source IN ('contact_form', 'property_inquiry', 'newsletter', 'chatbot', 'call_request')),
  source_page TEXT, -- URL where lead was captured

  -- Interest Details
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  interest_type TEXT, -- 'buying', 'renting', 'selling', 'valuation', 'general'
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_city TEXT,
  preferred_district TEXT,
  message TEXT,

  -- Status & Follow-up
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT, -- Agent name

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,

  -- Additional
  notes TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_address TEXT
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_property_id ON leads(property_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
```

### 4. **Categories Table**
Manages blog categories.

```sql
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Font Awesome class or emoji
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon) VALUES
  ('Piyasa Analizi', 'piyasa-analizi', 'Emlak piyasası trendleri ve analizler', '📊'),
  ('Yatırım Rehberi', 'yatirim-rehberi', 'Gayrimenkul yatırım tavsiyeleri', '💰'),
  ('Hukuki Süreçler', 'hukuki-surecler', 'Emlak alım-satım hukuki bilgiler', '⚖️'),
  ('Dekorasyon', 'dekorasyon', 'Ev dekorasyonu önerileri', '🏠'),
  ('Şehir Rehberi', 'sehir-rehberi', 'Bölge tanıtımları ve yaşam rehberi', '🗺️'),
  ('Haberler', 'haberler', 'Güncel emlak haberleri', '📰');
```

### 5. **Users Table** (Auth Extension)
Extends Supabase Auth for admin management.

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

---

## 🔐 Row Level Security (RLS) Policies

### Properties Table

```sql
-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Public can read published properties
CREATE POLICY "Public can view published properties"
ON properties FOR SELECT
TO anon, authenticated
USING (published = true AND status = 'active');

-- Authenticated users can read all
CREATE POLICY "Authenticated users can view all properties"
ON properties FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Only admins can update
CREATE POLICY "Admins can update properties"
ON properties FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Only admins can delete
CREATE POLICY "Admins can delete properties"
ON properties FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Blogs Table

```sql
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Public can read published blogs
CREATE POLICY "Public can view published blogs"
ON blogs FOR SELECT
TO anon, authenticated
USING (published = true);

-- Authenticated users can read all
CREATE POLICY "Authenticated users can view all blogs"
ON blogs FOR SELECT
TO authenticated
USING (true);

-- Admins and editors can insert/update
CREATE POLICY "Editors can manage blogs"
ON blogs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);
```

### Leads Table

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (form submissions)
CREATE POLICY "Anyone can submit leads"
ON leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can read leads
CREATE POLICY "Authenticated users can view leads"
ON leads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Only admins can update/delete leads
CREATE POLICY "Admins can manage leads"
ON leads FOR UPDATE, DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 📦 Storage Buckets

### Property Images Bucket

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Blog Images Bucket

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Same policies as property images
```

---

## 🔧 Database Functions

### Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-generate slug

```sql
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = lower(
      regexp_replace(
        regexp_replace(
          translate(NEW.title, 'çğıöşüÇĞİÖŞÜ', 'cgiosuCGIOSU'),
          '[^a-zA-Z0-9\\s-]', '', 'g'
        ),
        '\\s+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_property_slug BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

CREATE TRIGGER generate_blog_slug BEFORE INSERT OR UPDATE ON blogs
FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();
```

### Increment view count

```sql
CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE properties SET view_count = view_count + 1 WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blogs SET view_count = view_count + 1 WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Performance Optimization

### Materialized Views for Analytics

```sql
-- Property statistics by city
CREATE MATERIALIZED VIEW property_stats_by_city AS
SELECT
  city,
  COUNT(*) as total_properties,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  COUNT(*) FILTER (WHERE transaction_type = 'Satılık') as for_sale_count,
  COUNT(*) FILTER (WHERE transaction_type = 'Kiralık') as for_rent_count
FROM properties
WHERE published = true AND status = 'active'
GROUP BY city;

-- Refresh daily via cron job
CREATE INDEX ON property_stats_by_city(city);
```

---

## 🚀 API Integration Guide

See `/assets/js/supabase-client.js` for complete implementation.

**Key Operations:**
- `fetchProperties(filters)` - Get filtered property listings
- `fetchPropertyBySlug(slug)` - Get single property details
- `fetchBlogs(limit, category)` - Get blog posts
- `submitLead(leadData)` - Submit contact form
- `uploadPropertyImage(file)` - Upload to storage

---

## 📱 Admin Interface

Admin panel located at `/admin/supabase-admin.html` provides:
- Property CRUD operations with image upload
- Blog management with rich text editor
- Lead tracking dashboard
- Analytics overview
- User management

---

## 🔄 Migration Strategy

1. **Phase 1:** Set up Supabase project and run SQL migrations
2. **Phase 2:** Deploy admin panel for content entry
3. **Phase 3:** Populate initial data (migrate from localStorage if needed)
4. **Phase 4:** Update frontend to fetch from Supabase
5. **Phase 5:** Deprecate localStorage (keep as fallback initially)

---

## 📈 Next Steps

1. Create Supabase project at https://supabase.com
2. Run SQL migrations from this document
3. Configure storage buckets
4. Set up authentication (email/password + Google OAuth)
5. Deploy admin interface
6. Update environment variables in code
7. Test all CRUD operations
8. Monitor performance and optimize queries

---

## 🔗 Resources

- Supabase Dashboard: `https://app.supabase.com`
- API Documentation: `https://supabase.com/docs`
- JavaScript Client: `@supabase/supabase-js`
- Storage Guide: `https://supabase.com/docs/guides/storage`

---

**Last Updated:** 2025-11-24
**Version:** 1.0.0
