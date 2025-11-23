// FOKUS Emlak - Main JavaScript Module
// Common functions and utilities

// === LOCATION DATA ===
const locationData = {
    "Kocaeli": {
        districts: ["İzmit", "Gebze", "Kartepe", "Darıca", "Gölcük", "Karamürsel", "Başiskele", "Körfez"],
        neighborhoods: {
            "İzmit": ["Merkez", "Yahyakaptan", "Yenişehir", "Bağçeşme", "Karabaş", "Tepeköy", "Kozluk", "Tavşantepe"],
            "Gebze": ["Cumhuriyet", "Güzeller", "Eskihisar", "Pelitli", "Muallimköy", "Çayırova"],
            "Kartepe": ["Merkez", "Maşukiye", "Suadiye", "Arslanbey"],
            "Darıca": ["Merkez", "Kazıklı", "Emek"],
            "Gölcük": ["Merkez", "Değirmendere", "İhsaniye"],
            "default": ["Merkez", "Yenimahalle"]
        }
    },
    "Samsun": {
        districts: ["Atakum", "İlkadım", "Canik", "Tekkeköy", "Çarşamba", "Bafra"],
        neighborhoods: {
            "Atakum": ["Cumhuriyet", "Yenimahalle", "Mimar Sinan", "Esenevler", "Denizevleri", "Yalı", "Kurupelit"],
            "İlkadım": ["Kale", "Kutlukent", "Baruthane", "Hastane", "Selahiye"],
            "Canik": ["Merkez", "Kadiköy", "Gaziosmanpaşa"],
            "Tekkeköy": ["Merkez", "Soğuksu", "Ballıca"],
            "default": ["Merkez", "Yenimahalle"]
        }
    },
    "Sakarya": {
        districts: ["Adapazarı", "Serdivan", "Erenler", "Sapanca", "Akyazı", "Hendek"],
        neighborhoods: {
            "Adapazarı": ["Merkez", "Kemalpaşa", "İstiklal", "Yeni Camii"],
            "Serdivan": ["Kemalpaşa", "Adapazarı Yolu", "Merkez"],
            "Sapanca": ["Merkez", "Yanık", "Mahmudiye"],
            "default": ["Merkez"]
        }
    },
    "Ordu": {
        districts: ["Altınordu", "Fatsa", "Ünye", "Perşembe"],
        neighborhoods: {
            "Altınordu": ["Merkez", "Şirinevler", "Kumbaşı", "Bucak"],
            "Fatsa": ["Merkez", "Evkaf", "Dolunay"],
            "Ünye": ["Merkez", "Sahil", "Uğurlu"],
            "default": ["Merkez"]
        }
    }
};

// === TOAST NOTIFICATION SYSTEM ===
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    const colors = {
        'success': 'bg-white border-green-500 text-green-700',
        'error': 'bg-white border-red-500 text-red-700',
        'warning': 'bg-white border-amber-500 text-amber-700',
        'info': 'bg-white border-blue-500 text-blue-700'
    };

    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-circle-exclamation',
        'warning': 'fa-triangle-exclamation',
        'info': 'fa-info-circle'
    };

    toast.className = `p-4 rounded-lg shadow-lg border-l-4 ${colors[type]} toast-enter min-w-[300px] flex items-center gap-3 pointer-events-auto`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]} text-xl"></i>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-24 right-4 z-[70] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
    return container;
}

// === DYNAMIC DROPDOWN LOADERS ===
function loadDistricts(prefix) {
    const citySelect = document.getElementById(`${prefix}_city`);
    const districtSelect = document.getElementById(`${prefix}_district`);
    const neighborhoodSelect = document.getElementById(`${prefix}_neighborhood`);

    if (!citySelect || !districtSelect) return;

    const selectedCity = citySelect.value;

    districtSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    districtSelect.disabled = true;

    if (neighborhoodSelect) {
        neighborhoodSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
        neighborhoodSelect.disabled = true;
    }

    if (selectedCity && locationData[selectedCity]) {
        const districts = locationData[selectedCity].districts;
        districts.forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            option.textContent = d;
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    }
}

function loadNeighborhoods(prefix) {
    const citySelect = document.getElementById(`${prefix}_city`);
    const districtSelect = document.getElementById(`${prefix}_district`);
    const neighborhoodSelect = document.getElementById(`${prefix}_neighborhood`);

    if (!citySelect || !districtSelect || !neighborhoodSelect) return;

    const selectedCity = citySelect.value;
    const selectedDistrict = districtSelect.value;

    neighborhoodSelect.innerHTML = '<option value="">Mahalle Seçiniz</option>';
    neighborhoodSelect.disabled = true;

    if (selectedCity && selectedDistrict && locationData[selectedCity]) {
        const neighborhoods = locationData[selectedCity].neighborhoods[selectedDistrict] ||
            locationData[selectedCity].neighborhoods.default;

        neighborhoods.forEach(n => {
            const option = document.createElement('option');
            option.value = n;
            option.textContent = n;
            neighborhoodSelect.appendChild(option);
        });
        neighborhoodSelect.disabled = false;
    }
}

// === MOBILE MENU TOGGLE ===
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// === NAVBAR SCROLL EFFECT ===
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    }
});

// === COMPARISON SLIDER ===
function updateSlider(val) {
    const overlay = document.getElementById('comp-overlay');
    const handle = document.getElementById('comp-handle');

    if (overlay && handle) {
        overlay.style.width = val + "%";
        handle.style.left = val + "%";
    }
}

// === LISTINGS CAROUSEL SCROLL ===
function scrollListings(direction) {
    const container = document.getElementById('listing-container');
    if (container) {
        const scrollAmount = direction === 'left' ? -350 : 350;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

// === VOICE SEARCH SIMULATION ===
function startVoiceSearch() {
    const btn = document.querySelector('button[title="Sesli Arama"]');
    const input = document.getElementById('voice-input');

    if (!btn || !input) return;

    btn.classList.add('bg-red-100', 'text-red-600', 'animate-pulse');
    btn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>';

    showToast('Dinliyorum... Lütfen konuşun', 'info');

    setTimeout(() => {
        input.value = "İzmit Yahyakaptan 3+1 Satılık";
        btn.classList.remove('bg-red-100', 'text-red-600', 'animate-pulse');
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        showToast('Algılandı: İzmit Yahyakaptan 3+1 Satılık', 'success');
    }, 2500);
}

// === FORM SUBMISSION HANDLERS ===

// Search Form Handler
async function handleSearch(event) {
    event.preventDefault();

    const btn = document.getElementById('searchBtn');
    if (!btn) return;

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Aranıyor...';

    const formData = {
        timestamp: new Date().toISOString(),
        operation: document.getElementById('search_operation')?.value || '',
        type: document.getElementById('search_type')?.value || '',
        city: document.getElementById('search_city')?.value || '',
        district: document.getElementById('search_district')?.value || '',
        neighborhood: document.getElementById('search_neighborhood')?.value || '',
        rooms: document.getElementById('search_rooms')?.value || '',
        priceMin: document.getElementById('price_min')?.value || '',
        priceMax: document.getElementById('price_max')?.value || ''
    };

    try {
        const response = await API.searchProperties(formData);

        if (response.success) {
            showToast(`${formData.city} bölgesinde ${response.count || 0} ilan bulundu`, 'success');
            // Redirect to listings page with filters
            const params = new URLSearchParams(formData).toString();
            window.location.href = `/listings.html?${params}`;
        } else {
            throw new Error(response.message || 'Arama başarısız');
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

// Valuation Form Handler
async function handleValuation(event) {
    event.preventDefault();

    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Hesaplanıyor...';
    btn.disabled = true;

    const formData = {
        address: form.querySelector('input[placeholder*="Adres"]')?.value || '',
        area: form.querySelector('input[placeholder*="m²"]')?.value || '',
        buildingAge: form.querySelector('input[placeholder*="Yaş"]')?.value || ''
    };

    try {
        const response = await API.getValuation(formData);

        if (response.success) {
            const resultDiv = document.getElementById('valuation-result');
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <p class="font-bold"><i class="fa-solid fa-check-circle"></i>
                    Tahmini Aralık: ${response.minPrice?.toLocaleString('tr-TR')} ₺ - ${response.maxPrice?.toLocaleString('tr-TR')} ₺</p>
                    <p class="text-xs mt-1 text-green-700">Bu bir tahmindir. Kesin değerleme için danışmanımız arayacaktır.</p>
                `;
                resultDiv.classList.remove('hidden');
            }
            showToast('Değerleme tamamlandı!', 'success');
        } else {
            throw new Error(response.message || 'Değerleme başarısız');
        }
    } catch (error) {
        console.error('Valuation error:', error);
        showToast('Değerleme sırasında hata oluştu.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Lead Form Handler
async function handleLeadSubmit(event) {
    event.preventDefault();

    const btn = document.getElementById('leadBtn');
    if (!btn) return;

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Gönderiliyor...';

    const formData = {
        source: 'lead_form_homepage',
        operation: document.getElementById('lead_operation')?.value || '',
        type: document.getElementById('lead_type')?.value || '',
        city: document.getElementById('lead_city')?.value || '',
        district: document.getElementById('lead_district')?.value || '',
        budget: document.getElementById('lead_budget')?.value || '',
        rooms: document.getElementById('lead_rooms')?.value || '',
        phone: document.getElementById('lead_phone')?.value || ''
    };

    try {
        const response = await API.submitLead(formData);

        if (response.success) {
            showToast('Talebiniz başarıyla alındı! Danışmanımız sizi arayacak.', 'success');
            event.target.reset();
        } else {
            throw new Error(response.message || 'Talep gönderilemedi');
        }
    } catch (error) {
        console.error('Lead submit error:', error);
        showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

// === GOOGLE LOGIN HANDLER ===
async function handleGoogleLogin() {
    try {
        const result = await Auth.googleLogin();

        if (result.success) {
            showToast(`Hoşgeldiniz, ${result.user.name}!`, 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Google login error:', error);
        showToast('Giriş yapılırken hata oluştu.', 'error');
    }
}

// === CHAT WIDGET ===
function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (!chat) return;

    if (chat.classList.contains('hidden')) {
        chat.classList.remove('hidden');
        setTimeout(() => {
            chat.classList.remove('scale-95', 'opacity-0');
            chat.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        chat.classList.remove('scale-100', 'opacity-100');
        chat.classList.add('scale-95', 'opacity-0');
        setTimeout(() => chat.classList.add('hidden'), 300);
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');

    if (!input || !container) return;

    const msg = input.value.trim();
    if (!msg) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'bg-blue-900 text-white p-3 rounded-lg rounded-tr-none shadow-sm ml-auto max-w-[80%] mb-2 text-right';
    userDiv.textContent = msg;
    container.appendChild(userDiv);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        const aiDiv = document.createElement('div');
        aiDiv.className = 'bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-100 mr-auto max-w-[80%] mb-2';
        aiDiv.textContent = "Size nasıl yardımcı olabilirim? Danışmanlarımız kısa süre içinde size dönüş yapacaktır.";
        container.appendChild(aiDiv);
        container.scrollTop = container.scrollHeight;
    }, 1000);
}

// === MODAL HELPERS ===
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// === UTILITY FUNCTIONS ===
function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(dateString));
}

// === INITIALIZE ON DOM LOAD ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏠 FOKUS Emlak initialized');

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
