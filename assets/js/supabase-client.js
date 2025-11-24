// FOKUS Emlak - Supabase Client
// Centralized Supabase integration for all database operations

const SupabaseClient = {
    // Configuration (Replace with your Supabase project credentials)
    config: {
        url: 'https://YOUR_PROJECT_ID.supabase.co',
        anonKey: 'YOUR_ANON_KEY',
    },

    client: null,

    /**
     * Initialize Supabase client
     */
    async init() {
        if (typeof supabase === 'undefined') {
            console.error('[Supabase] Library not loaded. Please include Supabase JS SDK.');
            return false;
        }

        this.client = supabase.createClient(this.config.url, this.config.anonKey);
        console.log('[Supabase] Client initialized');
        return true;
    },

    /**
     * ======================
     * PROPERTIES OPERATIONS
     * ======================
     */

    /**
     * Fetch properties with filters
     */
    async fetchProperties(filters = {}) {
        try {
            let query = this.client
                .from('properties')
                .select('*')
                .eq('published', true)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.city) query = query.eq('city', filters.city);
            if (filters.district) query = query.eq('district', filters.district);
            if (filters.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
            if (filters.property_type) query = query.eq('property_type', filters.property_type);
            if (filters.rooms) query = query.eq('rooms', filters.rooms);
            if (filters.priceMin) query = query.gte('price', filters.priceMin);
            if (filters.priceMax) query = query.lte('price', filters.priceMax);
            if (filters.featured) query = query.eq('featured', true);

            // Pagination
            if (filters.limit) query = query.limit(filters.limit);
            if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

            const { data, error } = await query;

            if (error) throw error;

            console.log(`[Supabase] Fetched ${data.length} properties`);
            return { success: true, data, count: data.length };
        } catch (error) {
            console.error('[Supabase] Error fetching properties:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch single property by slug
     */
    async fetchPropertyBySlug(slug) {
        try {
            const { data, error } = await this.client
                .from('properties')
                .select('*')
                .eq('slug', slug)
                .eq('published', true)
                .single();

            if (error) throw error;

            // Increment view count (non-blocking)
            this.incrementPropertyViews(data.id);

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching property:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch single property by ID
     */
    async fetchPropertyById(id) {
        try {
            const { data, error } = await this.client
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching property:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Search properties with full-text search
     */
    async searchProperties(searchTerm) {
        try {
            const { data, error } = await this.client
                .from('properties')
                .select('*')
                .textSearch('title', searchTerm, {
                    type: 'websearch',
                    config: 'turkish'
                })
                .eq('published', true)
                .eq('status', 'active')
                .limit(20);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error searching properties:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create new property (Admin only)
     */
    async createProperty(propertyData) {
        try {
            const { data, error } = await this.client
                .from('properties')
                .insert([propertyData])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Property created:', data.id);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error creating property:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update property (Admin only)
     */
    async updateProperty(id, updates) {
        try {
            const { data, error } = await this.client
                .from('properties')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Property updated:', id);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error updating property:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete property (Admin only)
     */
    async deleteProperty(id) {
        try {
            const { error } = await this.client
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('[Supabase] Property deleted:', id);
            return { success: true };
        } catch (error) {
            console.error('[Supabase] Error deleting property:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Increment property view count
     */
    async incrementPropertyViews(propertyId) {
        try {
            await this.client.rpc('increment_property_views', { property_id: propertyId });
        } catch (error) {
            console.error('[Supabase] Error incrementing views:', error);
        }
    },

    /**
     * ==================
     * BLOGS OPERATIONS
     * ==================
     */

    /**
     * Fetch blogs with optional filters
     */
    async fetchBlogs(filters = {}) {
        try {
            let query = this.client
                .from('blogs')
                .select('*')
                .eq('published', true)
                .order('published_at', { ascending: false });

            if (filters.category) query = query.eq('category', filters.category);
            if (filters.featured) query = query.eq('featured', true);
            if (filters.limit) query = query.limit(filters.limit);

            const { data, error } = await query;

            if (error) throw error;

            console.log(`[Supabase] Fetched ${data.length} blogs`);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching blogs:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch single blog by slug
     */
    async fetchBlogBySlug(slug) {
        try {
            const { data, error } = await this.client
                .from('blogs')
                .select('*')
                .eq('slug', slug)
                .eq('published', true)
                .single();

            if (error) throw error;

            // Increment view count
            this.incrementBlogViews(data.id);

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching blog:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create new blog (Admin only)
     */
    async createBlog(blogData) {
        try {
            const { data, error } = await this.client
                .from('blogs')
                .insert([blogData])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Blog created:', data.id);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error creating blog:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update blog (Admin only)
     */
    async updateBlog(id, updates) {
        try {
            const { data, error } = await this.client
                .from('blogs')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Blog updated:', id);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error updating blog:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete blog (Admin only)
     */
    async deleteBlog(id) {
        try {
            const { error } = await this.client
                .from('blogs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log('[Supabase] Blog deleted:', id);
            return { success: true };
        } catch (error) {
            console.error('[Supabase] Error deleting blog:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Increment blog view count
     */
    async incrementBlogViews(blogId) {
        try {
            await this.client.rpc('increment_blog_views', { blog_id: blogId });
        } catch (error) {
            console.error('[Supabase] Error incrementing blog views:', error);
        }
    },

    /**
     * Fetch categories
     */
    async fetchCategories() {
        try {
            const { data, error } = await this.client
                .from('categories')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching categories:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * =================
     * LEADS OPERATIONS
     * =================
     */

    /**
     * Submit new lead (Public)
     */
    async submitLead(leadData) {
        try {
            // Add metadata
            leadData.user_agent = navigator.userAgent;
            leadData.source_page = window.location.href;

            const { data, error } = await this.client
                .from('leads')
                .insert([leadData])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Lead submitted:', data.id);

            // Track in analytics
            if (typeof Analytics !== 'undefined') {
                Analytics.trackLeadSubmission(leadData.source, leadData);
            }

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error submitting lead:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch leads (Admin only)
     */
    async fetchLeads(filters = {}) {
        try {
            let query = this.client
                .from('leads')
                .select('*, properties(*)')
                .order('created_at', { ascending: false });

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.priority) query = query.eq('priority', filters.priority);
            if (filters.limit) query = query.limit(filters.limit);

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching leads:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update lead status (Admin only)
     */
    async updateLeadStatus(id, status, notes = '') {
        try {
            const updates = { status };
            if (notes) updates.notes = notes;
            if (status === 'contacted') updates.contacted_at = new Date().toISOString();
            if (status === 'converted') updates.converted_at = new Date().toISOString();

            const { data, error } = await this.client
                .from('leads')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error updating lead:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ===================
     * STORAGE OPERATIONS
     * ===================
     */

    /**
     * Upload property image
     */
    async uploadPropertyImage(file, propertyId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await this.client.storage
                .from('property-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: publicUrlData } = this.client.storage
                .from('property-images')
                .getPublicUrl(filePath);

            console.log('[Supabase] Image uploaded:', publicUrlData.publicUrl);
            return { success: true, url: publicUrlData.publicUrl, path: filePath };
        } catch (error) {
            console.error('[Supabase] Error uploading image:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Upload blog cover image
     */
    async uploadBlogImage(file, blogId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${blogId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await this.client.storage
                .from('blog-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: publicUrlData } = this.client.storage
                .from('blog-images')
                .getPublicUrl(filePath);

            console.log('[Supabase] Blog image uploaded:', publicUrlData.publicUrl);
            return { success: true, url: publicUrlData.publicUrl, path: filePath };
        } catch (error) {
            console.error('[Supabase] Error uploading blog image:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete file from storage
     */
    async deleteFile(bucket, filePath) {
        try {
            const { error } = await this.client.storage
                .from(bucket)
                .remove([filePath]);

            if (error) throw error;

            console.log('[Supabase] File deleted:', filePath);
            return { success: true };
        } catch (error) {
            console.error('[Supabase] Error deleting file:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ========================
     * AUTHENTICATION OPERATIONS
     * ========================
     */

    /**
     * Sign in with email/password
     */
    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            console.log('[Supabase] User signed in:', data.user.email);
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            console.error('[Supabase] Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;

            console.log('[Supabase] User signed out');
            return { success: true };
        } catch (error) {
            console.error('[Supabase] Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current session
     */
    async getSession() {
        try {
            const { data, error } = await this.client.auth.getSession();
            if (error) throw error;

            return { success: true, session: data.session };
        } catch (error) {
            console.error('[Supabase] Get session error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current user profile
     */
    async getUserProfile() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return { success: true, profile: data };
        } catch (error) {
            console.error('[Supabase] Get profile error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ====================
     * STATISTICS & ANALYTICS
     * ====================
     */

    /**
     * Get property statistics
     */
    async getPropertyStats() {
        try {
            const { data, error } = await this.client
                .from('property_stats_by_city')
                .select('*');

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Error fetching stats:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get dashboard summary
     */
    async getDashboardSummary() {
        try {
            // Get counts in parallel
            const [propertiesRes, blogsRes, leadsRes] = await Promise.all([
                this.client.from('properties').select('id', { count: 'exact', head: true }),
                this.client.from('blogs').select('id', { count: 'exact', head: true }),
                this.client.from('leads').select('id', { count: 'exact', head: true })
            ]);

            return {
                success: true,
                data: {
                    totalProperties: propertiesRes.count || 0,
                    totalBlogs: blogsRes.count || 0,
                    totalLeads: leadsRes.count || 0
                }
            };
        } catch (error) {
            console.error('[Supabase] Error fetching dashboard summary:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize Supabase on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SupabaseClient.init());
} else {
    SupabaseClient.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseClient;
}
