// FOKUS Emlak - Multi-Language Support
// Google Translate Integration

const LanguageManager = {
    defaultLang: 'tr',
    supportedLanguages: {
        'tr': { name: 'Türkçe', flag: '🇹🇷', code: 'tr' },
        'en': { name: 'English', flag: '🇬🇧', code: 'en' },
        'ar': { name: 'العربية', flag: '🇸🇦', code: 'ar' }
    },

    init() {
        // Get saved language preference
        const savedLang = localStorage.getItem('fokus_language') || this.defaultLang;

        // Create language selector if not exists
        this.createLanguageSelector();

        // Initialize Google Translate
        this.initGoogleTranslate();

        // Set initial language
        if (savedLang !== this.defaultLang) {
            setTimeout(() => this.changeLanguage(savedLang), 1000);
        }
    },

    createLanguageSelector() {
        const selectorHTML = `
            <div id="language-selector" class="fixed top-24 right-4 z-50">
                <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <button id="lang-toggle" class="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 transition w-full text-left">
                        <span id="current-lang-flag" class="text-xl">🇹🇷</span>
                        <span id="current-lang-name" class="text-sm font-medium text-slate-700">Türkçe</span>
                        <i class="fa-solid fa-chevron-down text-xs text-slate-400 ml-2"></i>
                    </button>
                    <div id="lang-dropdown" class="hidden border-t border-slate-200">
                        ${Object.entries(this.supportedLanguages).map(([code, lang]) => `
                            <button onclick="LanguageManager.changeLanguage('${code}')"
                                    class="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition w-full text-left text-sm">
                                <span class="text-lg">${lang.flag}</span>
                                <span class="text-slate-700">${lang.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Mobile Language Button -->
            <div id="mobile-lang-btn" class="lg:hidden fixed bottom-32 right-4 z-50">
                <button onclick="document.getElementById('language-selector').scrollIntoView({behavior: 'smooth'})"
                        class="w-12 h-12 bg-blue-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-800 transition">
                    <i class="fa-solid fa-language text-xl"></i>
                </button>
            </div>

            <style>
                #language-selector {
                    min-width: 150px;
                }
                @media (max-width: 768px) {
                    #language-selector {
                        position: fixed;
                        top: auto;
                        bottom: 100px;
                        right: 4px;
                        left: 4px;
                        width: auto;
                    }
                }
                /* Hide Google Translate widget UI */
                .goog-te-banner-frame,
                .goog-te-gadget {
                    display: none !important;
                }
                body {
                    top: 0 !important;
                }
                .skiptranslate {
                    display: none !important;
                }
                #google_translate_element {
                    display: none;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', selectorHTML);

        // Toggle dropdown
        document.getElementById('lang-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('lang-dropdown');
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('lang-dropdown').classList.add('hidden');
        });
    },

    initGoogleTranslate() {
        // Add Google Translate Element (hidden)
        const translateDiv = document.createElement('div');
        translateDiv.id = 'google_translate_element';
        translateDiv.style.display = 'none';
        document.body.appendChild(translateDiv);

        // Load Google Translate script
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);

        // Initialize Google Translate
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({
                pageLanguage: 'tr',
                includedLanguages: 'tr,en,ar',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
        };
    },

    changeLanguage(langCode) {
        const lang = this.supportedLanguages[langCode];
        if (!lang) return;

        // Update UI
        document.getElementById('current-lang-flag').textContent = lang.flag;
        document.getElementById('current-lang-name').textContent = lang.name;

        // Hide dropdown
        document.getElementById('lang-dropdown').classList.add('hidden');

        // Save preference
        localStorage.setItem('fokus_language', langCode);

        // Trigger Google Translate
        if (langCode === this.defaultLang) {
            // Reset to default (Turkish)
            this.resetTranslation();
        } else {
            // Translate to selected language
            this.triggerGoogleTranslate(langCode);
        }

        // Show notification
        showToast(`Dil değiştirildi: ${lang.name}`, 'success');
    },

    triggerGoogleTranslate(langCode) {
        // Find and click the Google Translate dropdown
        const gtCombo = document.querySelector('.goog-te-combo');
        if (gtCombo) {
            gtCombo.value = langCode;
            gtCombo.dispatchEvent(new Event('change'));
        } else {
            // Fallback: reload page with lang parameter
            console.warn('Google Translate not ready, reloading...');
            setTimeout(() => window.location.reload(), 500);
        }
    },

    resetTranslation() {
        const gtCombo = document.querySelector('.goog-te-combo');
        if (gtCombo) {
            gtCombo.value = '';
            gtCombo.dispatchEvent(new Event('change'));
        }
    },

    getCurrentLanguage() {
        return localStorage.getItem('fokus_language') || this.defaultLang;
    }
};

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LanguageManager.init());
} else {
    LanguageManager.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
}
