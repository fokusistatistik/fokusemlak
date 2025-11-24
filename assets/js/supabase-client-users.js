// FOKUS Emlak - Supabase User Management Client Extension
// User authentication, favorites, offers, messages, notifications

// Extend existing SupabaseClient with user management features
Object.assign(SupabaseClient, {

    /**
     * =======================
     * AUTHENTICATION & SIGNUP
     * =======================
     */

    /**
     * Sign up new user
     */
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: userData.full_name || '',
                        phone: userData.phone || '',
                        role: userData.role || 'user'
                    }
                }
            });

            if (error) throw error;

            console.log('[Supabase] User signed up:', data.user.email);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('[Supabase] Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in with Google OAuth
     */
    async signInWithGoogle() {
        try {
            const { data, error } = await this.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/user-dashboard.html`
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Google sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        try {
            const { error } = await this.client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            return { success: true, message: 'Şifre sıfırlama linki email adresinize gönderildi' };
        } catch (error) {
            console.error('[Supabase] Password reset error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user password
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await this.client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return { success: true, message: 'Şifreniz güncellendi' };
        } catch (error) {
            console.error('[Supabase] Password update error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update user profile
     */
    async updateUserProfile(updates) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Profile updated');
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Profile update error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current user with profile
     */
    async getCurrentUser() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) return { success: false, error: 'Not authenticated' };

            const { data: profile, error } = await this.client
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            return { success: true, user: { ...user, profile } };
        } catch (error) {
            console.error('[Supabase] Get current user error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ===================
     * FAVORITES MANAGEMENT
     * ===================
     */

    /**
     * Add property to favorites
     */
    async addToFavorites(propertyId, notes = '') {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Giriş yapmanız gerekiyor');

            const { data, error } = await this.client
                .from('user_favorites')
                .insert([{
                    user_id: user.id,
                    property_id: propertyId,
                    notes
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    return { success: false, error: 'Bu ilan zaten favorilerinizde' };
                }
                throw error;
            }

            console.log('[Supabase] Added to favorites:', propertyId);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Add to favorites error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Remove property from favorites
     */
    async removeFromFavorites(propertyId) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await this.client
                .from('user_favorites')
                .delete()
                .match({
                    user_id: user.id,
                    property_id: propertyId
                });

            if (error) throw error;

            console.log('[Supabase] Removed from favorites:', propertyId);
            return { success: true };
        } catch (error) {
            console.error('[Supabase] Remove from favorites error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's favorites
     */
    async getFavorites() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_favorites')
                .select('*, properties(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log(`[Supabase] Fetched ${data.length} favorites`);
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get favorites error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if property is favorited
     */
    async isPropertyFavorited(propertyId) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) return { success: true, favorited: false };

            const { data, error } = await this.client
                .from('user_favorites')
                .select('id')
                .match({
                    user_id: user.id,
                    property_id: propertyId
                })
                .single();

            return { success: true, favorited: !!data };
        } catch (error) {
            return { success: true, favorited: false };
        }
    },

    /**
     * ====================
     * SAVED SEARCHES
     * ====================
     */

    /**
     * Save search criteria
     */
    async saveSearch(searchCriteria) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_saved_searches')
                .insert([{
                    user_id: user.id,
                    ...searchCriteria
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Search saved');
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Save search error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get saved searches
     */
    async getSavedSearches() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_saved_searches')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get saved searches error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete saved search
     */
    async deleteSavedSearch(searchId) {
        try {
            const { error } = await this.client
                .from('user_saved_searches')
                .delete()
                .eq('id', searchId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Delete saved search error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ====================
     * OFFERS MANAGEMENT
     * ====================
     */

    /**
     * Create new offer
     */
    async createOffer(offerData) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Giriş yapmanız gerekiyor');

            // Get property to find agent
            const { data: property } = await this.fetchPropertyById(offerData.property_id);

            const { data, error } = await this.client
                .from('user_offers')
                .insert([{
                    user_id: user.id,
                    property_id: offerData.property_id,
                    agent_id: property.data.contact_email ? null : user.id, // Set agent if available
                    offer_price: offerData.offer_price,
                    original_price: offerData.original_price,
                    message: offerData.message,
                    financing_type: offerData.financing_type
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Offer created');
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Create offer error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's offers
     */
    async getMyOffers(status = null) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let query = this.client
                .from('user_offers')
                .select('*, properties(*)')
                .eq('user_id', user.id);

            if (status) query = query.eq('status', status);

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get offers error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get offers for agent's properties
     */
    async getReceivedOffers(status = null) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let query = this.client
                .from('user_offers')
                .select('*, properties(*), user_profiles!user_id(*)')
                .eq('agent_id', user.id);

            if (status) query = query.eq('status', status);

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get received offers error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Respond to offer (agent)
     */
    async respondToOffer(offerId, response) {
        try {
            const updates = {
                status: response.status,
                responded_at: new Date().toISOString()
            };

            if (response.status === 'countered') {
                updates.counter_offer_price = response.counter_offer_price;
                updates.counter_offer_message = response.counter_offer_message;
            }

            const { data, error } = await this.client
                .from('user_offers')
                .update(updates)
                .eq('id', offerId)
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Offer responded');
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Respond to offer error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ====================
     * MESSAGING SYSTEM
     * ====================
     */

    /**
     * Generate thread ID for conversation
     */
    generateThreadId(userId1, userId2) {
        const sorted = [userId1, userId2].sort();
        return `${sorted[0]}_${sorted[1]}`;
    },

    /**
     * Send message
     */
    async sendMessage(messageData) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const threadId = this.generateThreadId(user.id, messageData.receiver_id);

            const { data, error } = await this.client
                .from('user_messages')
                .insert([{
                    thread_id: threadId,
                    sender_id: user.id,
                    receiver_id: messageData.receiver_id,
                    property_id: messageData.property_id || null,
                    subject: messageData.subject || null,
                    message: messageData.message,
                    message_type: messageData.message_type || 'text'
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('[Supabase] Message sent');
            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Send message error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get messages for a thread
     */
    async getMessages(receiverId) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const threadId = this.generateThreadId(user.id, receiverId);

            const { data, error } = await this.client
                .from('user_messages')
                .select(`
                    *,
                    sender:sender_id(id, full_name, avatar_url),
                    receiver:receiver_id(id, full_name, avatar_url),
                    property:property_id(title, slug)
                `)
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get messages error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all conversations
     */
    async getConversations() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_messages')
                .select(`
                    thread_id,
                    sender:sender_id(id, full_name, avatar_url),
                    receiver:receiver_id(id, full_name, avatar_url),
                    message,
                    read,
                    created_at
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by thread_id and get latest message
            const threads = {};
            data.forEach(msg => {
                if (!threads[msg.thread_id]) {
                    threads[msg.thread_id] = msg;
                }
            });

            return { success: true, data: Object.values(threads) };
        } catch (error) {
            console.error('[Supabase] Get conversations error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark message as read
     */
    async markMessageAsRead(messageId) {
        try {
            const { error } = await this.client
                .from('user_messages')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', messageId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Mark message read error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ====================
     * NOTIFICATIONS
     * ====================
     */

    /**
     * Get user notifications
     */
    async getNotifications(unreadOnly = false) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let query = this.client
                .from('user_notifications')
                .select('*')
                .eq('user_id', user.id);

            if (unreadOnly) {
                query = query.eq('read', false);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get notifications error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId) {
        try {
            const { error } = await this.client
                .from('user_notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Mark notification read error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await this.client
                .from('user_notifications')
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Mark all notifications read error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get unread counts
     */
    async getUnreadCounts() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) return { success: true, data: { messages: 0, notifications: 0 } };

            const [messagesRes, notificationsRes] = await Promise.all([
                this.client.from('user_messages').select('id', { count: 'exact', head: true })
                    .eq('receiver_id', user.id).eq('read', false),
                this.client.from('user_notifications').select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id).eq('read', false)
            ]);

            return {
                success: true,
                data: {
                    messages: messagesRes.count || 0,
                    notifications: notificationsRes.count || 0
                }
            };
        } catch (error) {
            console.error('[Supabase] Get unread counts error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * ====================
     * VIEW TRACKING
     * ====================
     */

    /**
     * Track property view
     */
    async trackPropertyView(propertyId, metadata = {}) {
        try {
            const { data: { user } } = await this.client.auth.getUser();

            const { error } = await this.client
                .from('user_property_views')
                .insert([{
                    user_id: user?.id || null,
                    property_id: propertyId,
                    session_id: this.getSessionId(),
                    ip_address: metadata.ip_address || null,
                    user_agent: navigator.userAgent,
                    time_spent_seconds: metadata.time_spent_seconds || 0,
                    photos_viewed: metadata.photos_viewed || 0
                }]);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('[Supabase] Track view error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get viewing history
     */
    async getViewingHistory(limit = 20) {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await this.client
                .from('user_property_views')
                .select('*, properties(*)')
                .eq('user_id', user.id)
                .order('viewed_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('[Supabase] Get viewing history error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get session ID (create if doesn't exist)
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('fokus_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('fokus_session_id', sessionId);
        }
        return sessionId;
    }
});

console.log('[Supabase] User management features loaded');
