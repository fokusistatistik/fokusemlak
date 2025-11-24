-- ========================================
-- FOKUS Emlak - Supabase Database Migration
-- Version: 1.0.0
-- Date: 2025-11-24
-- ========================================

-- This file contains the complete database schema for FOKUS Emlak
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ========================================
-- 1. ENABLE EXTENSIONS
-- ========================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geolocation (optional, for future map features)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- 2. CREATE TABLES
-- ========================================

-- ----------------
-- Properties Table
-- ----------------
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  listing_code TEXT UNIQUE NOT NULL DEFAULT 'FE-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),

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

-- ----------------
-- Blogs Table
-- ----------------
CREATE TABLE IF NOT EXISTS blogs (
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

-- ----------------
-- Leads Table
-- ----------------
CREATE TABLE IF NOT EXISTS leads (
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

-- ----------------
-- Categories Table
-- ----------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Font Awesome class or emoji
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------
-- User Profiles Table (extends auth.users)
-- ----------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Properties Indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_transaction ON properties(transaction_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_published ON properties(published);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- Full-text search index for properties
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties
USING gin(to_tsvector('turkish', title || ' ' || COALESCE(description, '')));

-- Blogs Indexes
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_search ON blogs
USING gin(to_tsvector('turkish', title || ' ' || COALESCE(content, '')));

-- Leads Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- ========================================
-- 4. CREATE FUNCTIONS & TRIGGERS
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to properties table
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply to blogs table
DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON blogs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate slug from title
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
    -- Add random suffix if slug exists
    IF EXISTS (SELECT 1 FROM properties WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
      NEW.slug = NEW.slug || '-' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to properties
DROP TRIGGER IF EXISTS generate_property_slug ON properties;
CREATE TRIGGER generate_property_slug
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

-- Apply to blogs
DROP TRIGGER IF EXISTS generate_blog_slug ON blogs;
CREATE TRIGGER generate_blog_slug
BEFORE INSERT OR UPDATE ON blogs
FOR EACH ROW EXECUTE FUNCTION generate_slug_from_title();

-- Increment view count functions
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

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ----------------
-- Properties Policies
-- ----------------

-- Public can read published properties
DROP POLICY IF EXISTS "Public can view published properties" ON properties;
CREATE POLICY "Public can view published properties"
ON properties FOR SELECT
TO anon, authenticated
USING (published = true AND status = 'active');

-- Authenticated admins/editors can view all
DROP POLICY IF EXISTS "Authenticated users can view all properties" ON properties;
CREATE POLICY "Authenticated users can view all properties"
ON properties FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Admins/editors can insert
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
CREATE POLICY "Admins can insert properties"
ON properties FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Admins/editors can update
DROP POLICY IF EXISTS "Admins can update properties" ON properties;
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
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
CREATE POLICY "Admins can delete properties"
ON properties FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ----------------
-- Blogs Policies
-- ----------------

-- Public can read published blogs
DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
CREATE POLICY "Public can view published blogs"
ON blogs FOR SELECT
TO anon, authenticated
USING (published = true);

-- Admins/editors can view all
DROP POLICY IF EXISTS "Authenticated users can view all blogs" ON blogs;
CREATE POLICY "Authenticated users can view all blogs"
ON blogs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- Admins/editors can manage blogs
DROP POLICY IF EXISTS "Editors can manage blogs" ON blogs;
CREATE POLICY "Editors can manage blogs"
ON blogs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

-- ----------------
-- Leads Policies
-- ----------------

-- Anyone can insert leads (form submissions)
DROP POLICY IF EXISTS "Anyone can submit leads" ON leads;
CREATE POLICY "Anyone can submit leads"
ON leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated admins/editors can read leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON leads;
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
DROP POLICY IF EXISTS "Admins can manage leads" ON leads;
CREATE POLICY "Admins can manage leads"
ON leads FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
CREATE POLICY "Admins can delete leads"
ON leads FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ----------------
-- Categories Policies
-- ----------------

-- Everyone can read categories
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
CREATE POLICY "Everyone can view categories"
ON categories FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ----------------
-- User Profiles Policies
-- ----------------

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ========================================
-- 6. INSERT DEFAULT DATA
-- ========================================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color, order_index) VALUES
  ('Piyasa Analizi', 'piyasa-analizi', 'Emlak piyasası trendleri ve analizler', '📊', '#3B82F6', 1),
  ('Yatırım Rehberi', 'yatirim-rehberi', 'Gayrimenkul yatırım tavsiyeleri', '💰', '#10B981', 2),
  ('Hukuki Süreçler', 'hukuki-surecler', 'Emlak alım-satım hukuki bilgiler', '⚖️', '#6366F1', 3),
  ('Dekorasyon', 'dekorasyon', 'Ev dekorasyonu önerileri', '🏠', '#F59E0B', 4),
  ('Şehir Rehberi', 'sehir-rehberi', 'Bölge tanıtımları ve yaşam rehberi', '🗺️', '#8B5CF6', 5),
  ('Haberler', 'haberler', 'Güncel emlak haberleri', '📰', '#EF4444', 6)
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- 7. MATERIALIZED VIEWS FOR ANALYTICS
-- ========================================

-- Property statistics by city
CREATE MATERIALIZED VIEW IF NOT EXISTS property_stats_by_city AS
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

CREATE INDEX IF NOT EXISTS idx_property_stats_city ON property_stats_by_city(city);

-- Refresh function (call this periodically via cron or manually)
CREATE OR REPLACE FUNCTION refresh_property_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY property_stats_by_city;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. STORAGE BUCKETS
-- ========================================

-- Note: Storage buckets are created via Supabase Dashboard or via API
-- This is for reference only. Run these in the Supabase Dashboard Storage section.

/*
-- Create property-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Create blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;
*/

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'FOKUS Emlak database migration completed successfully!';
  RAISE NOTICE 'Tables created: properties, blogs, leads, categories, user_profiles';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage buckets in Supabase Dashboard';
  RAISE NOTICE '2. Set up authentication (Email/Password + Google OAuth)';
  RAISE NOTICE '3. Create your first admin user';
  RAISE NOTICE '4. Update supabase-client.js with your project credentials';
END $$;
