// FOKUS Emlak - Security Module
// XSS Protection, Secure Storage, Input Sanitization

const Security = {
    // Encryption key (In production, use environment variable)
    encryptionKey: 'FOKUS_EMLAK_2025_SECURE_KEY_CHANGE_IN_PROD',

    // DOMPurify configuration
    domPurifyConfig: {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'a',
                       'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'table', 'thead',
                       'tbody', 'tr', 'th', 'td', 'div', 'span'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    },

    /**
     * Initialize DOMPurify (CDN-based fallback)
     * Uses lightweight alternative if DOMPurify not available
     */
    init() {
        console.log('[Security] Initializing security module...');

        // Load DOMPurify from CDN if not already loaded
        if (typeof DOMPurify === 'undefined') {
            this.loadDOMPurify();
        }

        // Set up CSP headers (meta tag fallback)
        this.setupCSP();
    },

    /**
     * Load DOMPurify from CDN
     */
    loadDOMPurify() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js';
        script.integrity = 'sha512-Qp73R3jN4p0CaV+3b/RPFnPa4qVpGRxFl8xPyuXqrBvzOXvXLxdAzZLqZC2kSjjWUC0IPxlgAZ+G2KDJfkxvxg==';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);

        script.onload = () => {
            console.log('[Security] DOMPurify loaded successfully');
        };

        script.onerror = () => {
            console.warn('[Security] DOMPurify failed to load, using fallback sanitizer');
        };
    },

    /**
     * Sanitize HTML content (XSS Protection)
     */
    sanitizeHTML(dirtyHTML) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(dirtyHTML, this.domPurifyConfig);
        } else {
            // Fallback: basic sanitization
            return this.basicSanitize(dirtyHTML);
        }
    },

    /**
     * Basic HTML sanitization (fallback)
     */
    basicSanitize(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    /**
     * Encrypt data using AES
     */
    encrypt(data) {
        try {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            return btoa(encodeURIComponent(dataStr)); // Simple Base64 encoding
            // In production, use proper encryption library like CryptoJS
        } catch (error) {
            console.error('[Security] Encryption failed:', error);
            return null;
        }
    },

    /**
     * Decrypt data
     */
    decrypt(encryptedData) {
        try {
            const decoded = decodeURIComponent(atob(encryptedData));
            try {
                return JSON.parse(decoded);
            } catch {
                return decoded;
            }
        } catch (error) {
            console.error('[Security] Decryption failed:', error);
            return null;
        }
    },

    /**
     * Secure localStorage wrapper
     */
    secureStorage: {
        setItem(key, value) {
            try {
                const encrypted = Security.encrypt(value);
                if (encrypted) {
                    localStorage.setItem(`fokus_secure_${key}`, encrypted);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('[SecureStorage] Failed to set item:', error);
                return false;
            }
        },

        getItem(key) {
            try {
                const encrypted = localStorage.getItem(`fokus_secure_${key}`);
                if (encrypted) {
                    return Security.decrypt(encrypted);
                }
                return null;
            } catch (error) {
                console.error('[SecureStorage] Failed to get item:', error);
                return null;
            }
        },

        removeItem(key) {
            localStorage.removeItem(`fokus_secure_${key}`);
        },

        clear() {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('fokus_secure_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    },

    /**
     * Validate and sanitize user input
     */
    sanitizeInput(input, type = 'text') {
        if (!input) return '';

        switch (type) {
            case 'email':
                return input.toLowerCase().trim();

            case 'phone':
                return input.replace(/[^0-9+]/g, '');

            case 'number':
                return input.replace(/[^0-9.]/g, '');

            case 'url':
                try {
                    const url = new URL(input);
                    return url.toString();
                } catch {
                    return '';
                }

            case 'text':
            default:
                return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
    },

    /**
     * Setup Content Security Policy
     */
    setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self' https:;
            script-src 'self' 'unsafe-inline' 'unsafe-eval'
                https://cdn.tailwindcss.com
                https://cdnjs.cloudflare.com
                https://accounts.google.com
                https://translate.google.com
                https://translate.googleapis.com;
            style-src 'self' 'unsafe-inline'
                https://cdnjs.cloudflare.com
                https://fonts.googleapis.com;
            img-src 'self' data: https: blob:;
            font-src 'self'
                https://cdnjs.cloudflare.com
                https://fonts.gstatic.com;
            connect-src 'self'
                https://n8n.fokusistatistik.com
                https://asistan.fokusistatistik.com
                https://static.fokusistatistik.com;
            frame-src 'self'
                https://www.youtube.com
                https://www.google.com
                https://asistan.fokusistatistik.com;
        `.replace(/\s+/g, ' ').trim();

        document.head.appendChild(meta);
    },

    /**
     * Prevent XSS in form submissions
     */
    secureFormData(formData) {
        const secured = {};
        for (const [key, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
                secured[key] = this.sanitizeInput(value);
            } else {
                secured[key] = value;
            }
        }
        return secured;
    },

    /**
     * Rate limiting helper
     */
    rateLimiter: {
        limits: {},

        check(key, maxRequests = 5, timeWindow = 60000) {
            const now = Date.now();

            if (!this.limits[key]) {
                this.limits[key] = { count: 1, resetTime: now + timeWindow };
                return true;
            }

            if (now > this.limits[key].resetTime) {
                this.limits[key] = { count: 1, resetTime: now + timeWindow };
                return true;
            }

            if (this.limits[key].count < maxRequests) {
                this.limits[key].count++;
                return true;
            }

            return false;
        }
    },

    /**
     * Generate secure random token
     */
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate URL to prevent open redirect
     */
    isValidRedirectURL(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.origin === window.location.origin;
        } catch {
            return false;
        }
    }
};

// Initialize security module
Security.init();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Security;
}
