// FOKUS Emlak - PWA Helper
// Service worker registration and PWA features

const PWA = {
    deferredPrompt: null,
    isInstalled: false,

    async init() {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('[PWA] Running as installed app');
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                console.log('[PWA] Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('[PWA] Service Worker registration failed:', error);
            }
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Handle successful install
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed successfully');
            this.isInstalled = true;
            this.hideInstallButton();
            showToast('Uygulama başarıyla yüklendi! 🎉', 'success');
        });

        // Request notification permission
        await this.requestNotificationPermission();

        // Monitor connection status
        this.monitorConnection();
    },

    showInstallButton() {
        // Create install button if it doesn't exist
        if (document.getElementById('pwa-install-btn')) return;

        const installHTML = `
            <div id="pwa-install-banner" class="fixed bottom-24 left-4 right-4 bg-white rounded-xl shadow-2xl p-4 z-40 border-2 border-blue-900 animate-slide-up md:left-auto md:right-6 md:w-96">
                <button onclick="PWA.hideInstallBanner()" class="absolute top-2 right-2 w-6 h-6 text-slate-400 hover:text-slate-600">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                        F
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 mb-1">FOKUS'u Yükle</h4>
                        <p class="text-xs text-slate-600">Hızlı erişim için ana ekrana ekle</p>
                    </div>
                </div>
                <button onclick="PWA.install()" id="pwa-install-btn" class="w-full bg-blue-900 text-white font-bold py-2 rounded-lg hover:bg-blue-800 transition mt-3 text-sm">
                    <i class="fa-solid fa-download mr-2"></i> Yükle
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', installHTML);
    },

    hideInstallButton() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.remove();
    },

    hideInstallBanner() {
        this.hideInstallButton();
        localStorage.setItem('fokus_pwa_install_dismissed', 'true');
    },

    async install() {
        if (!this.deferredPrompt) {
            console.log('[PWA] Install prompt not available');
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        console.log('[PWA] User choice:', outcome);

        if (outcome === 'accepted') {
            showToast('Uygulama yükleniyor...', 'info');
        }

        this.deferredPrompt = null;
        this.hideInstallButton();
    },

    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('[PWA] Notifications not supported');
            return;
        }

        if (Notification.permission === 'default') {
            // Don't ask immediately, wait for user interaction
            console.log('[PWA] Notification permission not requested yet');
        } else if (Notification.permission === 'granted') {
            console.log('[PWA] Notification permission granted');
            await this.subscribeToPush();
        }
    },

    async subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                // Subscribe to push notifications
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(
                        'YOUR_VAPID_PUBLIC_KEY' // Replace with actual VAPID public key
                    )
                });

                console.log('[PWA] Push subscription created');

                // Send subscription to server
                await this.sendSubscriptionToServer(subscription);
            }
        } catch (error) {
            console.error('[PWA] Push subscription failed:', error);
        }
    },

    async sendSubscriptionToServer(subscription) {
        try {
            await fetch('https://n8n.fokusistatistik.com/webhook/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: subscription,
                    userId: localStorage.getItem('fokus_token')
                })
            });
            console.log('[PWA] Subscription sent to server');
        } catch (error) {
            console.error('[PWA] Failed to send subscription:', error);
        }
    },

    async sendNotification(title, options = {}) {
        if (Notification.permission !== 'granted') return;

        const defaultOptions = {
            icon: '/assets/img/icon-192x192.png',
            badge: '/assets/img/icon-72x72.png',
            vibrate: [200, 100, 200],
            ...options
        };

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, defaultOptions);
        } else {
            new Notification(title, defaultOptions);
        }
    },

    monitorConnection() {
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                console.log('[PWA] Online');
                this.hideOfflineBanner();
            } else {
                console.log('[PWA] Offline');
                this.showOfflineBanner();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    },

    showOfflineBanner() {
        if (document.getElementById('offline-banner')) return;

        const bannerHTML = `
            <div id="offline-banner" class="fixed top-16 left-4 right-4 bg-amber-500 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-down">
                <i class="fa-solid fa-wifi-slash text-xl"></i>
                <div class="flex-1">
                    <div class="font-bold text-sm">Çevrimdışı Mod</div>
                    <div class="text-xs">Önbelleğe alınmış içerikler gösteriliyor</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
    },

    hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.classList.add('animate-slide-up');
            setTimeout(() => banner.remove(), 300);
        }
    },

    showUpdateNotification() {
        if (document.getElementById('update-notification')) return;

        const notificationHTML = `
            <div id="update-notification" class="fixed top-20 left-4 right-4 bg-blue-900 text-white p-4 rounded-xl shadow-2xl z-50 animate-slide-down md:left-auto md:right-6 md:w-96">
                <div class="flex items-center gap-3 mb-3">
                    <i class="fa-solid fa-download text-xl"></i>
                    <div class="flex-1">
                        <div class="font-bold">Güncelleme Hazır</div>
                        <div class="text-xs text-blue-200">Yeni özellikler mevcut</div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="PWA.applyUpdate()" class="flex-1 bg-white text-blue-900 font-bold py-2 rounded-lg hover:bg-blue-50 transition text-sm">
                        Güncelle
                    </button>
                    <button onclick="document.getElementById('update-notification').remove()" class="px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', notificationHTML);
    },

    applyUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            });
        }
    },

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    // Share API
    async share(data) {
        if (!navigator.share) {
            console.log('[PWA] Web Share API not supported');
            return false;
        }

        try {
            await navigator.share(data);
            console.log('[PWA] Share successful');
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('[PWA] Share failed:', error);
            }
            return false;
        }
    }
};

// Initialize PWA on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
    PWA.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWA;
}
