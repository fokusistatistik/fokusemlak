// FOKUS Emlak - Modern Chatbot Widget with Anti-Spam Protection
// Adapted from FOKUS216 design for FOKUS Emlak

(function () {
    // ============================================
    // SPAM ÖNLEME SİSTEMİ
    // ============================================

    const RATE_LIMITS = {
        MINUTE: { max: 3, window: 60000 }, // Dakikada 3 mesaj
        HOUR: { max: 30, window: 3600000 } // Saatte 30 mesaj
    };

    const SPAM_DETECTION = {
        minMessageLength: 2,
        maxSimilarity: 0.85, // %85 benzerlik spam olarak algılanır
        recentMessages: [],
        maxRecentMessages: 5
    };

    const BAN_DURATION = 5 * 60 * 1000; // 5 dakika ban
    const CAPTCHA_THRESHOLD = 15; // Saatte 15 mesajdan sonra CAPTCHA

    let messageTimestamps = {
        minute: [],
        hour: []
    };

    let lastMessage = '';
    let banUntil = 0;
    let captchaRequired = false;
    let captchaSolved = false;
    let captchaAnswer = 0;
    let pendingMessage = null;

    // IP fingerprint oluştur (tarayıcı parmak izi)
    function generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);

        return canvas.toDataURL() +
               navigator.userAgent +
               navigator.language +
               screen.colorDepth +
               screen.width + 'x' + screen.height;
    }

    const fingerprint = btoa(generateFingerprint()).slice(0, 32);

    // LocalStorage key'leri fingerprint ile
    const STORAGE_KEYS = {
        timestamps: `fokus_emlak_timestamps_${fingerprint}`,
        ban: `fokus_emlak_ban_${fingerprint}`,
        messages: `fokus_emlak_recent_${fingerprint}`,
        userId: `fokus_emlak_user_id_${fingerprint}`
    };

    // Kullanıcı ID'si oluştur
    let userId = localStorage.getItem(STORAGE_KEYS.userId);
    if (!userId) {
        userId = 'fokus_user_' + Math.random().toString(36).slice(2);
        localStorage.setItem(STORAGE_KEYS.userId, userId);
    }

    // LocalStorage'dan verileri yükle
    function loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.timestamps);
            if (stored) {
                const data = JSON.parse(stored);
                messageTimestamps.minute = data.minute || [];
                messageTimestamps.hour = data.hour || [];
            }

            const banData = localStorage.getItem(STORAGE_KEYS.ban);
            if (banData) {
                banUntil = parseInt(banData);
            }

            const recentData = localStorage.getItem(STORAGE_KEYS.messages);
            if (recentData) {
                SPAM_DETECTION.recentMessages = JSON.parse(recentData);
            }
        } catch (e) {
            console.error('Storage yükleme hatası:', e);
        }
    }

    // LocalStorage'a kaydet
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.timestamps, JSON.stringify(messageTimestamps));
            localStorage.setItem(STORAGE_KEYS.ban, banUntil.toString());
            localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(SPAM_DETECTION.recentMessages));
        } catch (e) {
            console.error('Storage kaydetme hatası:', e);
        }
    }

    // Eski zaman damgalarını temizle
    function cleanOldTimestamps() {
        const now = Date.now();
        messageTimestamps.minute = messageTimestamps.minute.filter(t => now - t < RATE_LIMITS.MINUTE.window);
        messageTimestamps.hour = messageTimestamps.hour.filter(t => now - t < RATE_LIMITS.HOUR.window);
    }

    // Rate limit kontrolü
    function checkRateLimit() {
        cleanOldTimestamps();

        if (messageTimestamps.minute.length >= RATE_LIMITS.MINUTE.max) {
            return {
                allowed: false,
                reason: 'minute',
                remaining: Math.ceil((RATE_LIMITS.MINUTE.window - (Date.now() - messageTimestamps.minute[0])) / 1000)
            };
        }

        if (messageTimestamps.hour.length >= RATE_LIMITS.HOUR.max) {
            return {
                allowed: false,
                reason: 'hour',
                remaining: Math.ceil((RATE_LIMITS.HOUR.window - (Date.now() - messageTimestamps.hour[0])) / 1000)
            };
        }

        return { allowed: true };
    }

    // Mesaj benzerliğini hesapla (Levenshtein mesafesi)
    function calculateSimilarity(str1, str2) {
        str1 = str1.toLowerCase().trim();
        str2 = str2.toLowerCase().trim();

        if (str1 === str2) return 1;

        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        const distance = matrix[len1][len2];
        const maxLen = Math.max(len1, len2);
        return 1 - (distance / maxLen);
    }

    // Spam tespiti
    function detectSpam(message) {
        // Çok kısa mesajlar
        if (message.length < SPAM_DETECTION.minMessageLength) {
            return { isSpam: true, reason: 'Mesaj çok kısa' };
        }

        // Tekrarlayan karakterler (örn: "aaaaaaa")
        if (/(.)\1{7,}/.test(message)) {
            return { isSpam: true, reason: 'Tekrarlayan karakterler tespit edildi' };
        }

        // Son mesajla aynı mı?
        if (message === lastMessage) {
            return { isSpam: true, reason: 'Aynı mesajı tekrar gönderemezsiniz' };
        }

        // Son mesajlara çok benzer mi?
        for (let recentMsg of SPAM_DETECTION.recentMessages) {
            const similarity = calculateSimilarity(message, recentMsg);
            if (similarity > SPAM_DETECTION.maxSimilarity) {
                return { isSpam: true, reason: 'Çok benzer mesajlar gönderiyorsunuz' };
            }
        }

        return { isSpam: false };
    }

    // CAPTCHA oluştur
    function generateCaptcha() {
        const operations = [
            { q: () => { const a = Math.floor(Math.random() * 10) + 1; const b = Math.floor(Math.random() * 10) + 1; return { text: `${a} + ${b}`, answer: a + b }; } },
            { q: () => { const a = Math.floor(Math.random() * 15) + 5; const b = Math.floor(Math.random() * 5) + 1; return { text: `${a} - ${b}`, answer: a - b }; } },
            { q: () => { const a = Math.floor(Math.random() * 10) + 1; const b = Math.floor(Math.random() * 10) + 1; return { text: `${a} × ${b}`, answer: a * b }; } }
        ];

        const operation = operations[Math.floor(Math.random() * operations.length)];
        const result = operation.q();

        const captchaQuestion = document.getElementById('fokus-captcha-question');
        if (captchaQuestion) {
            captchaQuestion.textContent = result.text + ' = ?';
        }
        captchaAnswer = result.answer;
    }

    // CAPTCHA göster
    function showCaptcha(message) {
        pendingMessage = message;
        captchaSolved = false;
        const captchaModal = document.getElementById('fokus-captcha-modal');
        const captchaInput = document.getElementById('fokus-captcha-input');
        const captchaError = document.getElementById('fokus-captcha-error');

        if (captchaModal && captchaInput && captchaError) {
            captchaInput.value = '';
            captchaError.style.display = 'none';
            generateCaptcha();
            captchaModal.style.display = 'flex';
            captchaInput.focus();
        }
    }

    // CAPTCHA doğrula
    function verifyCaptcha() {
        const captchaInput = document.getElementById('fokus-captcha-input');
        const captchaError = document.getElementById('fokus-captcha-error');
        const captchaModal = document.getElementById('fokus-captcha-modal');

        if (!captchaInput) return;

        const userAnswer = parseInt(captchaInput.value);

        if (userAnswer === captchaAnswer) {
            captchaSolved = true;
            captchaRequired = false;
            if (captchaModal) captchaModal.style.display = 'none';

            if (pendingMessage) {
                sendMessageToServer(pendingMessage);
                pendingMessage = null;
            }
        } else {
            if (captchaError) captchaError.style.display = 'block';
            captchaInput.value = '';
            generateCaptcha();
            captchaInput.focus();
        }
    }

    // Ban kontrolü
    function checkBan() {
        const now = Date.now();
        if (now < banUntil) {
            const remainingSeconds = Math.ceil((banUntil - now) / 1000);
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            return {
                banned: true,
                remaining: `${minutes}:${seconds.toString().padStart(2, '0')}`
            };
        }
        return { banned: false };
    }

    // Mesaj kaydet
    function recordMessage(message) {
        const now = Date.now();
        messageTimestamps.minute.push(now);
        messageTimestamps.hour.push(now);

        lastMessage = message;
        SPAM_DETECTION.recentMessages.push(message);

        if (SPAM_DETECTION.recentMessages.length > SPAM_DETECTION.maxRecentMessages) {
            SPAM_DETECTION.recentMessages.shift();
        }

        // Saatte 15 mesajdan sonra CAPTCHA gerekli
        if (messageTimestamps.hour.length >= CAPTCHA_THRESHOLD && !captchaSolved) {
            captchaRequired = true;
        }

        saveToStorage();
    }

    // Ban uygula
    function applyBan() {
        banUntil = Date.now() + BAN_DURATION;
        saveToStorage();

        addMessage('⛔ Çok fazla spam girişimi tespit edildi. 5 dakika süreyle mesaj gönderemezsiniz.', 'warning');
    }

    // ============================================
    // WIDGET OLUŞTURMA
    // ============================================

    function createWidget() {
        const widgetHTML = `
            <style>
                #fokus-chat-widget * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                #fokus-chat-toggle-btn {
                    position: fixed;
                    bottom: 4px;
                    right: 4px;
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    border: none;
                    border-radius: 50%;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.4);
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }

                #fokus-chat-toggle-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(30, 58, 138, 0.5);
                }

                @media (min-width: 640px) {
                    #fokus-chat-toggle-btn {
                        bottom: 24px;
                        right: 24px;
                        width: 64px;
                        height: 64px;
                    }
                }

                #fokus-chat-popup {
                    display: none;
                    position: fixed;
                    bottom: 80px;
                    right: 0;
                    left: 0;
                    width: 100%;
                    height: calc(100vh - 6rem);
                    background: #ffffff;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                    border-top: 2px solid #1e3a8a;
                    z-index: 9999;
                    flex-direction: column;
                    overflow: hidden;
                }

                #fokus-chat-popup.active {
                    display: flex;
                }

                @media (min-width: 640px) {
                    #fokus-chat-popup {
                        bottom: 110px;
                        right: 24px;
                        left: auto;
                        width: 400px;
                        height: 600px;
                        border-radius: 20px;
                        border: 2px solid #1e3a8a;
                    }
                }

                #fokus-chat-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    color: white;
                    position: relative;
                }

                #fokus-chat-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                }

                #fokus-chat-header-icon {
                    width: 48px;
                    height: 48px;
                    min-width: 48px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                #fokus-chat-header-title {
                    flex-grow: 1;
                    font-size: 15px;
                    font-weight: 500;
                    line-height: 1.4;
                }

                #fokus-chat-header-title strong {
                    font-weight: 600;
                    display: block;
                    margin-bottom: 2px;
                    font-size: 16px;
                }

                #fokus-chat-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                #fokus-chat-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                #fokus-chat-messages {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f8f9fa;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    scroll-behavior: smooth;
                }

                #fokus-chat-messages::-webkit-scrollbar {
                    width: 6px;
                }

                #fokus-chat-messages::-webkit-scrollbar-track {
                    background: transparent;
                }

                #fokus-chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.15);
                    border-radius: 10px;
                }

                #fokus-typing-indicator {
                    display: none;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    background: #e9ecef;
                    color: #495057;
                    padding: 10px 12px;
                    border-radius: 18px;
                    max-width: fit-content;
                    align-self: flex-start;
                }

                #fokus-typing-indicator span {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background-color: #6c757d;
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: blink 1.4s infinite ease-in-out;
                }

                #fokus-typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                #fokus-typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes blink {
                    0%, 80%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    40% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }

                .fokus-message {
                    font-size: 14px;
                    padding: 10px 14px;
                    border-radius: 18px;
                    max-width: 75%;
                    line-height: 1.5;
                    word-wrap: break-word;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }

                .fokus-message.user {
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    color: white;
                    margin-left: auto;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 2px 8px rgba(30, 58, 138, 0.2);
                }

                .fokus-message.bot {
                    background: white;
                    color: #212529;
                    margin-right: auto;
                    border-bottom-left-radius: 4px;
                    border: 1px solid #e9ecef;
                }

                .fokus-message.warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                    border-left: 4px solid #ffc107;
                    max-width: 85%;
                }

                .fokus-message a {
                    color: #1e3a8a;
                    text-decoration: none;
                    font-weight: 500;
                    border-bottom: 1px solid rgba(30, 58, 138, 0.3);
                }

                .fokus-message a:hover {
                    color: #1e40af;
                    border-bottom-color: #1e40af;
                }

                .fokus-message.user a {
                    color: white !important;
                    text-decoration: underline;
                }

                #fokus-chat-form {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    padding: 12px 16px;
                    background: white;
                    border-top: 1px solid #e9ecef;
                }

                #fokus-chat-input {
                    resize: none;
                    overflow-y: hidden;
                    height: 40px;
                    max-height: 120px;
                    line-height: 1.5;
                    font-size: 14px;
                    padding: 10px 14px;
                    border-radius: 20px;
                    border: 1px solid #dee2e6;
                    outline: none;
                    flex-grow: 1;
                    font-family: inherit;
                    background: #f8f9fa;
                    transition: all 0.2s ease;
                }

                #fokus-chat-input:focus {
                    background: white;
                    border-color: #1e3a8a;
                    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
                }

                #fokus-chat-submit {
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    min-width: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
                    transition: all 0.2s ease;
                }

                #fokus-chat-submit:hover:not(:disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 6px 16px rgba(30, 58, 138, 0.4);
                }

                #fokus-chat-submit:disabled {
                    background: #ced4da;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                #fokus-char-counter {
                    font-size: 11px;
                    color: #6c757d;
                    text-align: right;
                    padding: 0 16px 8px;
                    font-weight: 500;
                }

                #fokus-char-counter.warning {
                    color: #fd7e14;
                }

                #fokus-char-counter.error {
                    color: #dc3545;
                }

                .fokus-quick-questions {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 8px 12px;
                    align-items: flex-start;
                }

                .fokus-quick-question-btn {
                    background: white;
                    color: #1e3a8a;
                    border: 1.5px solid #1e3a8a;
                    border-radius: 18px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: left;
                    max-width: 90%;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .fokus-quick-question-btn:hover {
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
                }

                #fokus-captcha-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }

                #fokus-captcha-content {
                    background: white;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }

                #fokus-captcha-content h3 {
                    color: #1e3a8a;
                    margin-bottom: 20px;
                    font-size: 20px;
                }

                #fokus-captcha-question {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 20px 0;
                    color: #212529;
                }

                #fokus-captcha-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 16px;
                    text-align: center;
                    margin: 15px 0;
                    outline: none;
                }

                #fokus-captcha-input:focus {
                    border-color: #1e3a8a;
                }

                #fokus-captcha-submit {
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }

                #fokus-captcha-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
                }

                #fokus-captcha-error {
                    color: #dc3545;
                    font-size: 14px;
                    margin-top: 10px;
                    display: none;
                }
            </style>

            <div id="fokus-chat-widget">
                <button id="fokus-chat-toggle-btn" aria-label="Chat aç/kapat">
                    <i class="fa-solid fa-comments"></i>
                </button>

                <div id="fokus-chat-popup">
                    <div id="fokus-chat-header">
                        <div id="fokus-chat-header-icon">
                            <i class="fa-solid fa-robot" style="color: #1e3a8a;"></i>
                        </div>
                        <div id="fokus-chat-header-title">
                            <strong>FOKUS Asistan</strong>
                            Size nasıl yardımcı olabilirim?
                        </div>
                        <button id="fokus-chat-close" aria-label="Kapat">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>

                    <div id="fokus-chat-messages"></div>
                    <div id="fokus-typing-indicator">
                        Yazıyor<span></span><span></span><span></span>
                    </div>

                    <form id="fokus-chat-form" autocomplete="off">
                        <textarea id="fokus-chat-input" placeholder="Mesajınızı yazın..." rows="1" maxlength="1000"></textarea>
                        <button id="fokus-chat-submit" type="submit" aria-label="Gönder">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                    <div id="fokus-char-counter">0 / 1000</div>
                </div>
            </div>

            <div id="fokus-captcha-modal">
                <div id="fokus-captcha-content">
                    <h3>🔒 Güvenlik Doğrulaması</h3>
                    <p>Lütfen aşağıdaki basit soruyu cevaplayın:</p>
                    <div id="fokus-captcha-question"></div>
                    <input type="text" id="fokus-captcha-input" placeholder="Cevabınızı girin">
                    <div id="fokus-captcha-error">Yanlış cevap, lütfen tekrar deneyin.</div>
                    <button id="fokus-captcha-submit" type="button">Doğrula</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    // ============================================
    // MESAJLAŞMA FONKSİYONLARI
    // ============================================

    loadFromStorage();
    createWidget();

    const chatToggleBtn = document.getElementById('fokus-chat-toggle-btn');
    const chatPopup = document.getElementById('fokus-chat-popup');
    const chatClose = document.getElementById('fokus-chat-close');
    const chatMessages = document.getElementById('fokus-chat-messages');
    const chatForm = document.getElementById('fokus-chat-form');
    const chatInput = document.getElementById('fokus-chat-input');
    const chatSubmit = document.getElementById('fokus-chat-submit');
    const typingIndicator = document.getElementById('fokus-typing-indicator');
    const charCounter = document.getElementById('fokus-char-counter');

    // Toggle chat
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            chatPopup.classList.toggle('active');
            if (chatPopup.classList.contains('active')) {
                chatInput.focus();
            }
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatPopup.classList.remove('active');
        });
    }

    // Bildirim sesi
    const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKJ0fPTgjMGHm7A7+OZTR8MTKXh8bllHAU7k9ryy3ksBSl+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU8ldvyy3YqBSh+zPLaisEGHm/A7+OZTR8MTKXh8bllHAU8ldvyy3ksBSh+zPLaizsIGWe57OibUBELTqvl8bBlGwU=');
    notificationSound.volume = 0.3;

    // Karakter sayacını güncelle
    if (chatInput && charCounter) {
        chatInput.addEventListener('input', () => {
            const length = chatInput.value.length;
            charCounter.textContent = `${length} / 1000`;

            if (length > 900) {
                charCounter.className = 'error';
            } else if (length > 700) {
                charCounter.className = 'warning';
            } else {
                charCounter.className = '';
            }

            // Auto resize
            chatInput.style.height = 'auto';
            const newHeight = Math.min(chatInput.scrollHeight, 120);
            chatInput.style.height = newHeight + 'px';
        });
    }

    // Mesaj kutusuna mesaj ekle
    function addMessage(text, sender = 'bot') {
        if (!chatMessages) return;

        const div = document.createElement('div');
        div.className = `fokus-message ${sender}`;

        let cleanText = text || '';
        cleanText = cleanText.replace(/\\n/g, '\n');
        cleanText = cleanText.replace(/\\t/g, ' ');
        cleanText = cleanText.replace(/\\\\/g, '\\');
        cleanText = cleanText.trim();

        let htmlContent = cleanText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/^- (.*$)/gm, '• $1')
            .replace(/^\* (.*$)/gm, '• $1')
            .replace(/\n/g, '<br>');

        div.innerHTML = htmlContent;

        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (sender === 'bot' && chatMessages.children.length > 2) {
            notificationSound.play().catch(e => console.log('Ses çalınamadı:', e));
        }
    }

    // Sunucuya mesaj gönder
    async function sendMessageToServer(message) {
        addMessage(message, 'user');

        if (chatSubmit) chatSubmit.disabled = true;
        if (typingIndicator) typingIndicator.style.display = 'flex';
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch('https://n8n.fokusistatistik.com/webhook/fokus216clasic250003', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Fingerprint': fingerprint
                },
                body: JSON.stringify({
                    user_id: userId,
                    message: message,
                    fingerprint: fingerprint
                }),
            });

            if (!res.ok) throw new Error('Sunucu hatası');

            const data = await res.json();
            if (typingIndicator) typingIndicator.style.display = 'none';
            if (chatSubmit) chatSubmit.disabled = false;
            addMessage(data.reply || 'Cevap alınamadı.', 'bot');
        } catch (err) {
            if (typingIndicator) typingIndicator.style.display = 'none';
            if (chatSubmit) chatSubmit.disabled = false;
            addMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'bot');
        }
    }

    // Hızlı sorular ekle
    function addQuickQuestions() {
        const questions = [
            'Satılık emlak arıyorum',
            'Evimi değerlendirmek istiyorum',
            'Danışman ile görüşmek istiyorum'
        ];

        const container = document.createElement('div');
        container.className = 'fokus-quick-questions';

        questions.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'fokus-quick-question-btn';
            btn.textContent = q;
            btn.type = 'button';
            btn.onclick = () => {
                container.remove();
                if (chatInput) chatInput.value = q;
                if (chatForm) chatForm.dispatchEvent(new Event('submit'));
            };
            container.appendChild(btn);
        });

        if (chatMessages) {
            chatMessages.appendChild(container);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // İlk karşılama mesajı
    addMessage('Merhaba! Ben FOKUS Asistan, size nasıl yardımcı olabilirim?', 'bot');
    addQuickQuestions();

    // CAPTCHA event listeners
    const captchaSubmitBtn = document.getElementById('fokus-captcha-submit');
    const captchaInput = document.getElementById('fokus-captcha-input');

    if (captchaSubmitBtn) {
        captchaSubmitBtn.addEventListener('click', verifyCaptcha);
    }

    if (captchaInput) {
        captchaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyCaptcha();
            }
        });
    }

    // Enter tuşu ile gönder
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (chatForm) chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Form gönderilince çalışır
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const msg = chatInput ? chatInput.value.trim() : '';
            if (!msg) return;

            // Ban kontrolü
            const banCheck = checkBan();
            if (banCheck.banned) {
                addMessage(`⛔ Geçici olarak engellendiniz. Kalan süre: ${banCheck.remaining}`, 'warning');
                return;
            }

            // Rate limit kontrolü
            const rateCheck = checkRateLimit();
            if (!rateCheck.allowed) {
                if (rateCheck.reason === 'minute') {
                    addMessage(`⏱️ Dakikada en fazla ${RATE_LIMITS.MINUTE.max} mesaj gönderebilirsiniz. Lütfen ${rateCheck.remaining} saniye bekleyin.`, 'warning');
                } else {
                    addMessage(`⏱️ Saatte en fazla ${RATE_LIMITS.HOUR.max} mesaj gönderebilirsiniz. Lütfen ${Math.floor(rateCheck.remaining / 60)} dakika bekleyin.`, 'warning');

                    if (messageTimestamps.hour.length >= RATE_LIMITS.HOUR.max + 3) {
                        applyBan();
                    }
                }
                return;
            }

            // Spam tespiti
            const spamCheck = detectSpam(msg);
            if (spamCheck.isSpam) {
                addMessage(`⚠️ ${spamCheck.reason}`, 'warning');

                const spamAttempts = parseInt(sessionStorage.getItem('spam_attempts') || '0') + 1;
                sessionStorage.setItem('spam_attempts', spamAttempts.toString());

                if (spamAttempts >= 3) {
                    applyBan();
                }
                return;
            }

            // CAPTCHA kontrolü
            if (captchaRequired && !captchaSolved) {
                showCaptcha(msg);
                if (chatInput) {
                    chatInput.value = '';
                    chatInput.style.height = '40px';
                }
                if (charCounter) {
                    charCounter.textContent = '0 / 1000';
                    charCounter.className = '';
                }
                return;
            }

            // Mesajı kaydet
            recordMessage(msg);

            // Input'u temizle
            if (chatInput) {
                chatInput.value = '';
                chatInput.style.height = '40px';
            }
            if (charCounter) {
                charCounter.textContent = '0 / 1000';
                charCounter.className = '';
            }

            // Mesajı gönder
            sendMessageToServer(msg);

            // CAPTCHA'yı sıfırla
            captchaSolved = false;
        });
    }

})();
