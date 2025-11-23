// FOKUS Emlak - API Integration Module
// n8n Webhook Endpoints

const API = {
    baseURL: 'https://n8n.fokusistatistik.com',

    endpoints: {
        // Authentication
        register: '/webhook/auth/register',
        login: '/webhook/auth/login',
        googleAuth: '/webhook/auth/google',
        logout: '/webhook/auth/logout',

        // Property Search & Listings
        search: '/webhook/property/search',
        getProperty: '/webhook/property/get',
        getAllProperties: '/webhook/property/all',

        // AI Tools
        valuation: '/webhook/ai/valuation',
        virtualRenovation: '/webhook/ai/renovation',

        // Lead Generation
        lead: '/webhook/lead/submit',
        sellProperty: '/webhook/property/sell',

        // Contact & Support
        contact: '/webhook/contact/submit',
        newsletter: '/webhook/newsletter/subscribe',
        tracker: '/webhook/tracker/check',

        // Blog & Content
        getBlogPosts: '/webhook/blog/all',
        getBlogPost: '/webhook/blog/get',

        // Market Data
        marketData: '/webhook/data/market',
        heatmap: '/webhook/data/heatmap'
    },

    // Generic fetch wrapper
    async request(endpoint, method = 'GET', data = null, useAuth = false) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add auth token if required
        if (useAuth) {
            const token = localStorage.getItem('fokus_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const error = await response.json().catch(() => ({
                    error: 'Network response was not ok'
                }));
                throw new Error(error.message || error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    // Authentication Methods
    async register(userData) {
        return await this.request(this.endpoints.register, 'POST', {
            ...userData,
            timestamp: new Date().toISOString(),
            source: 'web_app'
        });
    },

    async login(credentials) {
        return await this.request(this.endpoints.login, 'POST', {
            ...credentials,
            timestamp: new Date().toISOString()
        });
    },

    async googleAuth(googleToken) {
        return await this.request(this.endpoints.googleAuth, 'POST', {
            token: googleToken,
            timestamp: new Date().toISOString()
        });
    },

    async logout() {
        return await this.request(this.endpoints.logout, 'POST', {}, true);
    },

    // Property Methods
    async searchProperties(filters) {
        return await this.request(this.endpoints.search, 'POST', {
            ...filters,
            timestamp: new Date().toISOString()
        });
    },

    async getProperty(propertyId) {
        return await this.request(`${this.endpoints.getProperty}/${propertyId}`, 'GET');
    },

    async getAllProperties(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`${this.endpoints.getAllProperties}?${queryString}`, 'GET');
    },

    // AI Tools
    async getValuation(propertyData) {
        return await this.request(this.endpoints.valuation, 'POST', {
            ...propertyData,
            timestamp: new Date().toISOString()
        });
    },

    async requestVirtualRenovation(imageData) {
        return await this.request(this.endpoints.virtualRenovation, 'POST', {
            ...imageData,
            timestamp: new Date().toISOString()
        });
    },

    // Lead Generation
    async submitLead(leadData) {
        return await this.request(this.endpoints.lead, 'POST', {
            ...leadData,
            timestamp: new Date().toISOString(),
            source: 'lead_form'
        });
    },

    async submitSellProperty(propertyData) {
        return await this.request(this.endpoints.sellProperty, 'POST', {
            ...propertyData,
            timestamp: new Date().toISOString()
        });
    },

    // Contact & Support
    async submitContact(contactData) {
        return await this.request(this.endpoints.contact, 'POST', {
            ...contactData,
            timestamp: new Date().toISOString()
        });
    },

    async subscribeNewsletter(email, preferences = {}) {
        return await this.request(this.endpoints.newsletter, 'POST', {
            email,
            ...preferences,
            timestamp: new Date().toISOString()
        });
    },

    async checkTracker(trackingCode) {
        return await this.request(`${this.endpoints.tracker}/${trackingCode}`, 'GET');
    },

    // Blog
    async getBlogPosts(limit = 10, offset = 0) {
        return await this.request(`${this.endpoints.getBlogPosts}?limit=${limit}&offset=${offset}`, 'GET');
    },

    async getBlogPost(slug) {
        return await this.request(`${this.endpoints.getBlogPost}/${slug}`, 'GET');
    },

    // Market Data
    async getMarketData(region = null) {
        const params = region ? `?region=${region}` : '';
        return await this.request(`${this.endpoints.marketData}${params}`, 'GET');
    },

    async getHeatmapData(city, period = '1y') {
        return await this.request(`${this.endpoints.heatmap}?city=${city}&period=${period}`, 'GET');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
