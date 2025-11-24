// FOKUS Emlak - AI-Powered Smart Search
// Natural Language Processing for Property Search

const AISearch = {
    // Search intent patterns
    patterns: {
        location: /(?:İzmit|Gebze|Kartepe|Darıca|Gölcük|Atakum|İlkadım|Canik|Yahyakaptan|Yenişehir|Cumhuriyet)/gi,
        propertyType: /(?:daire|villa|arsa|işyeri|ofis|dubleks|apart|konut|ticari)/gi,
        transactionType: /(?:satılık|kiralık|sat|kirala|almak|kiralamak)/gi,
        rooms: /(?:(\d+)\s*\+\s*(\d+)|(\d+)\s*oda)/gi,
        price: /(?:(\d+(?:\.\d+)?)\s*(?:milyon|bin|m|k|₺|TL)|(\d+(?:\.\d+)?)\s*ile\s*(\d+(?:\.\d+)?)\s*(?:milyon|bin|arasında))/gi,
        features: /(?:havuz|asansör|otopark|balkon|teras|bahçe|deniz manzara|site içi|güvenlik)/gi,
        urgency: /(?:acil|hemen|ivedi|yakın zamanda|bu hafta)/gi
    },

    // Initialize AI Search
    init() {
        console.log('[AI Search] Smart search initialized');
        this.setupSearchEnhancement();
    },

    // Setup search input enhancement
    setupSearchEnhancement() {
        const searchInputs = document.querySelectorAll('input[id*="voice-input"], input[type="search"]');

        searchInputs.forEach(input => {
            // Add AI indicator
            const aiIndicator = document.createElement('div');
            aiIndicator.className = 'absolute left-12 top-1/2 transform -translate-y-1/2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold hidden';
            aiIndicator.innerHTML = '<i class="fa-solid fa-brain mr-1"></i> AI';
            aiIndicator.id = 'ai-indicator';

            if (input.parentElement.style.position !== 'relative') {
                input.parentElement.style.position = 'relative';
            }
            input.parentElement.appendChild(aiIndicator);

            // Enhanced search suggestions
            input.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length > 3) {
                    aiIndicator.classList.remove('hidden');
                    this.showSmartSuggestions(query, input);
                } else {
                    aiIndicator.classList.add('hidden');
                }
            });

            // Handle search on enter
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeAISearch(input.value);
                }
            });
        });
    },

    // Parse natural language query
    parseQuery(query) {
        const parsed = {
            original: query,
            location: null,
            propertyType: null,
            transactionType: null,
            rooms: null,
            priceMin: null,
            priceMax: null,
            features: [],
            urgent: false
        };

        // Extract location
        const locationMatch = query.match(this.patterns.location);
        if (locationMatch) {
            parsed.location = locationMatch[0];
        }

        // Extract property type
        const propertyMatch = query.match(this.patterns.propertyType);
        if (propertyMatch) {
            parsed.propertyType = this.normalizePropertyType(propertyMatch[0]);
        }

        // Extract transaction type
        const transactionMatch = query.match(this.patterns.transactionType);
        if (transactionMatch) {
            parsed.transactionType = transactionMatch[0].toLowerCase().includes('kira') ? 'kiralik' : 'satilik';
        }

        // Extract rooms
        const roomsMatch = query.match(this.patterns.rooms);
        if (roomsMatch) {
            if (roomsMatch[1] && roomsMatch[2]) {
                parsed.rooms = `${roomsMatch[1]}+${roomsMatch[2]}`;
            } else if (roomsMatch[3]) {
                parsed.rooms = roomsMatch[3];
            }
        }

        // Extract price
        const priceMatches = [...query.matchAll(this.patterns.price)];
        if (priceMatches.length > 0) {
            priceMatches.forEach(match => {
                const value = parseFloat(match[1] || match[2]);
                const multiplier = match[0].includes('milyon') || match[0].includes('m') ? 1000000 :
                                 match[0].includes('bin') || match[0].includes('k') ? 1000 : 1;

                if (match[3]) {
                    // Range detected
                    parsed.priceMin = value * multiplier;
                    parsed.priceMax = parseFloat(match[3]) * multiplier;
                } else if (!parsed.priceMax) {
                    parsed.priceMax = value * multiplier;
                }
            });
        }

        // Extract features
        const featureMatches = query.match(this.patterns.features);
        if (featureMatches) {
            parsed.features = featureMatches.map(f => f.toLowerCase());
        }

        // Check urgency
        parsed.urgent = this.patterns.urgency.test(query);

        return parsed;
    },

    // Normalize property type to standard format
    normalizePropertyType(type) {
        const normalized = {
            'daire': 'daire',
            'apart': 'daire',
            'konut': 'daire',
            'villa': 'villa',
            'arsa': 'arsa',
            'ofis': 'işyeri',
            'işyeri': 'işyeri',
            'ticari': 'işyeri',
            'dubleks': 'villa'
        };

        return normalized[type.toLowerCase()] || type;
    },

    // Execute AI-powered search
    executeAISearch(query) {
        if (!query || query.trim().length === 0) {
            showToast('Lütfen bir arama terimi girin', 'warning');
            return;
        }

        // Parse the query
        const parsed = this.parseQuery(query);

        console.log('[AI Search] Parsed query:', parsed);

        // Show processing toast
        showToast('AI ile aranıyor... 🤖', 'info', 2000);

        // Build URL parameters
        const params = new URLSearchParams();

        if (parsed.transactionType) params.append('operation', parsed.transactionType === 'satilik' ? 'Satılık' : 'Kiralık');
        if (parsed.propertyType) params.append('type', parsed.propertyType);
        if (parsed.location) {
            // Try to determine if it's city or district
            const cities = ['Kocaeli', 'Samsun', 'Sakarya', 'Ordu'];
            if (cities.includes(parsed.location)) {
                params.append('city', parsed.location);
            } else {
                params.append('district', parsed.location);
            }
        }
        if (parsed.rooms) params.append('rooms', parsed.rooms);
        if (parsed.priceMin) params.append('priceMin', parsed.priceMin);
        if (parsed.priceMax) params.append('priceMax', parsed.priceMax);
        if (parsed.features.length > 0) params.append('features', parsed.features.join(','));

        // Track the search
        if (typeof Analytics !== 'undefined') {
            Analytics.trackPropertySearch({
                query: query,
                parsed: parsed,
                ai_powered: true
            });
        }

        // Redirect to listings with filters
        setTimeout(() => {
            window.location.href = `/listings.html?${params.toString()}&ai=true&q=${encodeURIComponent(query)}`;
        }, 500);
    },

    // Show smart suggestions
    showSmartSuggestions(query, inputElement) {
        const parsed = this.parseQuery(query);

        // Remove existing suggestions
        const existingSuggestions = document.getElementById('ai-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }

        // Create suggestions dropdown
        const suggestions = document.createElement('div');
        suggestions.id = 'ai-suggestions';
        suggestions.className = 'absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 z-50';

        let suggestionsHTML = '<div class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">';
        suggestionsHTML += '<i class="fa-solid fa-lightbulb text-amber-500"></i> AI Anladığım:';
        suggestionsHTML += '</div><div class="space-y-2">';

        if (parsed.location) {
            suggestionsHTML += `<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-location-dot text-blue-600"></i> <span class="text-slate-700">Konum: <strong>${parsed.location}</strong></span></div>`;
        }

        if (parsed.transactionType) {
            suggestionsHTML += `<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-tag text-green-600"></i> <span class="text-slate-700">İşlem: <strong>${parsed.transactionType === 'satilik' ? 'Satılık' : 'Kiralık'}</strong></span></div>`;
        }

        if (parsed.propertyType) {
            suggestionsHTML += `<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-home text-purple-600"></i> <span class="text-slate-700">Tip: <strong>${parsed.propertyType}</strong></span></div>`;
        }

        if (parsed.rooms) {
            suggestionsHTML += `<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-bed text-amber-600"></i> <span class="text-slate-700">Oda: <strong>${parsed.rooms}</strong></span></div>`;
        }

        if (parsed.priceMax) {
            suggestionsHTML += `<div class="flex items-center gap-2 text-sm"><i class="fa-solid fa-money-bill text-green-600"></i> <span class="text-slate-700">Bütçe: <strong>max ₺${(parsed.priceMax / 1000000).toFixed(1)}M</strong></span></div>`;
        }

        suggestionsHTML += '</div>';
        suggestionsHTML += '<button onclick="AISearch.executeAISearch(\'' + query.replace(/'/g, "\\'") + '\')" class="mt-3 w-full bg-blue-900 text-white font-bold py-2 rounded-lg hover:bg-blue-800 transition text-sm">';
        suggestionsHTML += '<i class="fa-solid fa-search mr-2"></i> Bu Kriterlere Göre Ara';
        suggestionsHTML += '</button>';

        suggestions.innerHTML = suggestionsHTML;

        // Position suggestions
        const rect = inputElement.getBoundingClientRect();
        suggestions.style.width = rect.width + 'px';

        inputElement.parentElement.appendChild(suggestions);

        // Close suggestions on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeSuggestions(e) {
                if (!suggestions.contains(e.target) && e.target !== inputElement) {
                    suggestions.remove();
                    document.removeEventListener('click', closeSuggestions);
                }
            });
        }, 100);
    },

    // Example searches for user guidance
    exampleSearches: [
        "İzmit'te 3+1 satılık daire",
        "Atakum'da kiralık 2+1 deniz manzaralı",
        "4 milyon ile 5 milyon arası villa",
        "Gebze'de havuzlu site içi daire",
        "Yahyakaptan'da acil satılık"
    ]
};

// Initialize AI Search on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AISearch.init());
} else {
    AISearch.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AISearch;
}
