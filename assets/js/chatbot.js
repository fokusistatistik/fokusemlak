// FOKUS Emlak - Chatbot Widget
// Modern chat interface with template messages and webhook integration

const FokusChat = {
    isOpen: false,
    messages: [],
    webhookUrl: 'https://n8n.fokusistatistik.com/webhook/chat/message',

    templates: [
        { icon: '🏠', text: 'Satılık ev arıyorum', category: 'search' },
        { icon: '🔑', text: 'Kiralık daire bakıyorum', category: 'search' },
        { icon: '💰', text: 'Evimi değerlendirmek istiyorum', category: 'valuation' },
        { icon: '📞', text: 'Danışman ile görüşmek istiyorum', category: 'contact' },
        { icon: '📊', text: 'Piyasa analizi almak istiyorum', category: 'analysis' },
        { icon: '🎯', text: 'Yatırım fırsatları neler?', category: 'investment' }
    ],

    init() {
        this.createWidget();
        this.attachEventListeners();
        this.loadChatHistory();
    },

    createWidget() {
        const chatHTML = `
            <!-- Chat Toggle Button -->
            <button id="chat-toggle-btn" class="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 flex items-center justify-center group">
                <i class="fa-solid fa-comments text-xl sm:text-2xl group-hover:scale-110 transition-transform"></i>
                <span id="chat-unread-badge" class="hidden absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">0</span>
            </button>

            <!-- Chat Modal -->
            <div id="chat-modal" class="hidden fixed bottom-20 sm:bottom-24 right-0 sm:right-6 left-0 sm:left-auto w-full sm:w-96 h-[calc(100vh-6rem)] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border-t-2 sm:border-2 border-blue-900 animate-slide-up">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-robot text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold">FOKUS Asistan</h3>
                            <div class="flex items-center gap-1 text-xs text-green-300">
                                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Çevrimiçi
                            </div>
                        </div>
                    </div>
                    <button onclick="FokusChat.toggle()" class="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Messages Area -->
                <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    <!-- Welcome Message -->
                    <div class="flex gap-3 animate-fade-in">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <i class="fa-solid fa-robot text-blue-900"></i>
                        </div>
                        <div class="flex-1">
                            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200">
                                <p class="text-sm text-slate-700">Merhaba! 👋 Size nasıl yardımcı olabilirim?</p>
                            </div>
                            <span class="text-xs text-slate-400 mt-1 block">Şimdi</span>
                        </div>
                    </div>

                    <!-- Template Buttons -->
                    <div id="chat-templates" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${this.templates.map(t => `
                            <button onclick="FokusChat.sendTemplate('${t.text}')" class="bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-900 rounded-xl p-3 text-left transition-all duration-200 group">
                                <div class="text-2xl mb-1">${t.icon}</div>
                                <div class="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-blue-900">${t.text}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-3 sm:p-4 bg-white border-t border-slate-200">
                    <div class="flex gap-2">
                        <input
                            type="text"
                            id="chat-input"
                            placeholder="Mesajınızı yazın..."
                            class="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-900 text-sm"
                            onkeypress="if(event.key==='Enter') FokusChat.sendMessage()"
                        >
                        <button onclick="FokusChat.sendMessage()" class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-900 hover:bg-blue-800 text-white rounded-xl flex items-center justify-center transition">
                            <i class="fa-solid fa-paper-plane text-sm sm:text-base"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span class="text-[10px] sm:text-xs">Powered by AI</span>
                        <a href="https://wa.me/908505550000" target="_blank" class="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 text-[10px] sm:text-xs">
                            <i class="fa-brands fa-whatsapp"></i> WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            <!-- Typing Indicator (hidden by default) -->
            <div id="typing-indicator" class="hidden flex gap-3 animate-fade-in">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-robot text-blue-900"></i>
                </div>
                <div class="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-200">
                    <div class="flex gap-1">
                        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    },

    attachEventListeners() {
        document.getElementById('chat-toggle-btn').addEventListener('click', () => this.toggle());
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const modal = document.getElementById('chat-modal');
        const btn = document.getElementById('chat-toggle-btn');

        if (this.isOpen) {
            modal.classList.remove('hidden');
            btn.innerHTML = '<i class="fa-solid fa-xmark text-2xl"></i>';
            this.clearUnreadBadge();
        } else {
            modal.classList.add('hidden');
            btn.innerHTML = '<i class="fa-solid fa-comments text-2xl"></i>';
        }
    },

    async sendTemplate(text) {
        await this.sendMessage(text);
        // Hide templates after first use
        const templates = document.getElementById('chat-templates');
        if (templates) templates.style.display = 'none';
    },

    async sendMessage(customText = null) {
        const input = document.getElementById('chat-input');
        const message = customText || input.value.trim();

        if (!message) return;

        // Add user message to UI
        this.addMessageToUI('user', message);

        // Clear input
        if (!customText) input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            // Send to webhook
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    userId: this.getUserId(),
                    timestamp: new Date().toISOString(),
                    sessionId: this.getSessionId()
                })
            });

            const data = await response.json();

            // Hide typing indicator
            this.hideTyping();

            // Add bot response
            if (data.reply) {
                this.addMessageToUI('bot', data.reply);
            } else {
                // Fallback response
                this.addMessageToUI('bot', this.getAutoResponse(message));
            }

            // Save to history
            this.saveChatHistory();

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping();
            this.addMessageToUI('bot', 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin veya WhatsApp üzerinden bize ulaşın.');
        }
    },

    addMessageToUI(sender, text) {
        const messagesContainer = document.getElementById('chat-messages');
        const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const messageHTML = sender === 'user'
            ? `
                <div class="flex gap-3 justify-end animate-fade-in">
                    <div class="flex-1 flex flex-col items-end">
                        <div class="bg-blue-900 text-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-[80%]">
                            <p class="text-sm">${this.escapeHtml(text)}</p>
                        </div>
                        <span class="text-xs text-slate-400 mt-1">${time}</span>
                    </div>
                    <div class="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-user text-white text-sm"></i>
                    </div>
                </div>
            `
            : `
                <div class="flex gap-3 animate-fade-in">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-robot text-blue-900"></i>
                    </div>
                    <div class="flex-1">
                        <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-200">
                            <p class="text-sm text-slate-700">${this.escapeHtml(text)}</p>
                        </div>
                        <span class="text-xs text-slate-400 mt-1">${time}</span>
                    </div>
                </div>
            `;

        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Save message
        this.messages.push({ sender, text, time });
    },

    showTyping() {
        const messagesContainer = document.getElementById('chat-messages');
        const indicator = document.getElementById('typing-indicator').cloneNode(true);
        indicator.id = 'active-typing';
        indicator.classList.remove('hidden');
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    hideTyping() {
        const indicator = document.getElementById('active-typing');
        if (indicator) indicator.remove();
    },

    getAutoResponse(message) {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('satılık') || lowerMsg.includes('sat')) {
            return 'Satılık ilanlarımıza göz atabilirsiniz! Size özel bir araştırma yapayım mı? 🏠';
        } else if (lowerMsg.includes('kiralık') || lowerMsg.includes('kira')) {
            return 'Kiralık ilanlarımızı inceleyebilirsiniz. Hangi bölgeyi tercih edersiniz? 🔑';
        } else if (lowerMsg.includes('fiyat') || lowerMsg.includes('değer')) {
            return 'Ücretsiz AI değerleme sistemimizle evinizin değerini hemen öğrenebilirsiniz! Deneyeceğimiz? 💰';
        } else if (lowerMsg.includes('danışman') || lowerMsg.includes('iletişim')) {
            return 'Uzman danışmanlarımızla hemen görüşebilirsiniz! 📞 +90 850 555 00 00';
        } else {
            return 'Mesajınız için teşekkürler! Danışmanlarımız en kısa sürede size dönüş yapacak. Acil durumlar için WhatsApp üzerinden ulaşabilirsiniz. 🙏';
        }
    },

    getUserId() {
        let userId = localStorage.getItem('fokus_chat_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fokus_chat_user_id', userId);
        }
        return userId;
    },

    getSessionId() {
        let sessionId = sessionStorage.getItem('fokus_chat_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('fokus_chat_session_id', sessionId);
        }
        return sessionId;
    },

    saveChatHistory() {
        try {
            localStorage.setItem('fokus_chat_history', JSON.stringify(this.messages.slice(-50))); // Keep last 50 messages
        } catch (e) {
            console.warn('Failed to save chat history', e);
        }
    },

    loadChatHistory() {
        try {
            const history = localStorage.getItem('fokus_chat_history');
            if (history) {
                this.messages = JSON.parse(history);
                // Optionally reload messages to UI
            }
        } catch (e) {
            console.warn('Failed to load chat history', e);
        }
    },

    clearUnreadBadge() {
        const badge = document.getElementById('chat-unread-badge');
        if (badge) {
            badge.classList.add('hidden');
            badge.textContent = '0';
        }
    },

    showUnreadBadge(count) {
        const badge = document.getElementById('chat-unread-badge');
        if (badge && count > 0) {
            badge.classList.remove('hidden');
            badge.textContent = count;
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    FokusChat.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FokusChat;
}
