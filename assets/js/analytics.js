// FOKUS Emlak - Analytics & Tracking Module
// Google Analytics 4 Integration

const Analytics = {
    // Google Analytics 4 Measurement ID (replace with actual ID in production)
    measurementId: 'G-XXXXXXXXXX',

    // Initialize Google Analytics
    init() {
        if (this.measurementId === 'G-XXXXXXXXXX') {
            console.warn('[Analytics] Using demo measurement ID. Replace with production ID.');
        }

        // Load Google Analytics script
        this.loadGA4();

        // Track initial page view
        this.trackPageView();

        // Set up auto tracking
        this.setupAutoTracking();
    },

    // Load GA4 script
    loadGA4() {
        // gtag.js script
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        document.head.appendChild(gtagScript);

        // Initialize dataLayer
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', this.measurementId, {
            'send_page_view': false, // We'll handle this manually
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
        });

        console.log('[Analytics] Google Analytics initialized');
    },

    // Track page view
    trackPageView(path = window.location.pathname) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_path: path,
                page_title: document.title,
                page_location: window.location.href
            });

            console.log('[Analytics] Page view tracked:', path);
        }
    },

    // Track custom event
    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...parameters,
                timestamp: new Date().toISOString()
            });

            console.log('[Analytics] Event tracked:', eventName, parameters);
        }
    },

    // Track property view
    trackPropertyView(propertyId, propertyData = {}) {
        this.trackEvent('view_item', {
            item_id: propertyId,
            item_name: propertyData.title || 'Property',
            item_category: 'Real Estate',
            item_category2: propertyData.type || 'Unknown',
            price: propertyData.price || 0,
            currency: 'TRY'
        });
    },

    // Track property search
    trackPropertySearch(searchParams) {
        this.trackEvent('search', {
            search_term: searchParams.query || '',
            filters: JSON.stringify(searchParams)
        });
    },

    // Track lead submission
    trackLeadSubmission(formType, leadData = {}) {
        this.trackEvent('generate_lead', {
            form_type: formType,
            lead_source: 'website',
            city: leadData.city || '',
            property_type: leadData.type || ''
        });
    },

    // Track contact form
    trackContactForm(formType) {
        this.trackEvent('contact_form_submit', {
            form_type: formType,
            form_location: window.location.pathname
        });
    },

    // Track file download
    trackDownload(fileName, fileType) {
        this.trackEvent('file_download', {
            file_name: fileName,
            file_type: fileType
        });
    },

    // Track external link click
    trackExternalLink(url, linkText) {
        this.trackEvent('click', {
            link_url: url,
            link_text: linkText,
            outbound: true
        });
    },

    // Track scroll depth
    trackScrollDepth(percentage) {
        this.trackEvent('scroll', {
            percent_scrolled: percentage
        });
    },

    // Track social share
    trackSocialShare(platform, content) {
        this.trackEvent('share', {
            method: platform,
            content_type: content.type || 'property',
            item_id: content.id || ''
        });
    },

    // Track chatbot interaction
    trackChatbotInteraction(action) {
        this.trackEvent('chatbot_interaction', {
            action: action,
            page: window.location.pathname
        });
    },

    // Track language change
    trackLanguageChange(fromLang, toLang) {
        this.trackEvent('language_change', {
            from_language: fromLang,
            to_language: toLang
        });
    },

    // Track PWA install
    trackPWAInstall() {
        this.trackEvent('pwa_install', {
            platform: navigator.platform,
            user_agent: navigator.userAgent
        });
    },

    // Track calculator usage
    trackCalculatorUse(calculatorType, parameters) {
        this.trackEvent('calculator_use', {
            calculator_type: calculatorType,
            ...parameters
        });
    },

    // Set up automatic tracking
    setupAutoTracking() {
        // Track scroll depth
        let maxScroll = 0;
        const scrollMilestones = [25, 50, 75, 100];
        const trackedMilestones = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercentage = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );

            if (scrollPercentage > maxScroll) {
                maxScroll = scrollPercentage;

                scrollMilestones.forEach(milestone => {
                    if (scrollPercentage >= milestone && !trackedMilestones.has(milestone)) {
                        trackedMilestones.add(milestone);
                        this.trackScrollDepth(milestone);
                    }
                });
            }
        });

        // Track external links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const url = new URL(link.href, window.location.origin);
                if (url.origin !== window.location.origin) {
                    this.trackExternalLink(link.href, link.textContent);
                }
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form && form.id) {
                this.trackEvent('form_submit', {
                    form_id: form.id,
                    form_name: form.name || form.id
                });
            }
        });

        // Track errors (optional)
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                error_message: e.message,
                error_source: e.filename,
                error_line: e.lineno
            });
        });

        console.log('[Analytics] Auto-tracking enabled');
    },

    // Set user properties
    setUserProperties(properties) {
        if (typeof gtag !== 'undefined') {
            gtag('set', 'user_properties', properties);
        }
    },

    // Track conversion
    trackConversion(value, currency = 'TRY') {
        this.trackEvent('conversion', {
            value: value,
            currency: currency
        });
    },

    // Track time on page (call before page unload)
    trackTimeOnPage() {
        const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
        this.trackEvent('time_on_page', {
            duration_seconds: timeOnPage,
            page: window.location.pathname
        });
    }
};

// Store page load time
Analytics.pageLoadTime = Date.now();

// Track time on page before unload
window.addEventListener('beforeunload', () => {
    Analytics.trackTimeOnPage();
});

// Initialize analytics on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Analytics.init());
} else {
    Analytics.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}
