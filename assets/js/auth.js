// FOKUS Emlak - Authentication Module
// Handles Google OAuth and traditional login/register

const Auth = {
    // Check if user is logged in
    isAuthenticated() {
        const token = localStorage.getItem('fokus_token');
        const user = localStorage.getItem('fokus_user');
        return !!(token && user);
    },

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('fokus_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Save auth data
    saveAuth(token, user) {
        localStorage.setItem('fokus_token', token);
        localStorage.setItem('fokus_user', JSON.stringify(user));
        localStorage.setItem('fokus_login_time', new Date().toISOString());
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem('fokus_token');
        localStorage.removeItem('fokus_user');
        localStorage.removeItem('fokus_login_time');
        localStorage.removeItem('fokus_google_data');
    },

    // Traditional Login
    async login(email, password) {
        try {
            const response = await API.login({ email, password });

            if (response.success && response.token) {
                this.saveAuth(response.token, response.user);
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Traditional Register
    async register(userData) {
        try {
            const response = await API.register(userData);

            if (response.success && response.token) {
                this.saveAuth(response.token, response.user);
                return { success: true, user: response.user };
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Test Login (Bypass - for development only)
    async testLogin(email = 'test@fokusemlak.com') {
        const testUser = {
            id: 'test_' + Date.now(),
            email: email,
            name: 'Test Kullanıcı',
            role: 'user',
            avatar: 'https://ui-avatars.com/api/?name=Test+User&background=1e3a8a&color=fff',
            createdAt: new Date().toISOString()
        };

        const testToken = 'test_token_' + btoa(email + Date.now());

        this.saveAuth(testToken, testUser);
        console.log('🧪 Test login successful:', testUser);

        return { success: true, user: testUser };
    },

    // Google OAuth Login
    async googleLogin() {
        try {
            // Initialize Google OAuth (requires Google Sign-In SDK)
            if (typeof google === 'undefined' || !google.accounts) {
                console.error('Google Sign-In SDK not loaded');
                // Fallback to test login in development
                return this.testLogin('google_test@fokusemlak.com');
            }

            return new Promise((resolve, reject) => {
                google.accounts.id.initialize({
                    client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual Client ID
                    callback: async (response) => {
                        try {
                            const credential = response.credential;

                            // Send to n8n webhook for verification
                            const result = await API.googleAuth(credential);

                            if (result.success && result.token) {
                                this.saveAuth(result.token, result.user);
                                localStorage.setItem('fokus_google_data', JSON.stringify(response));
                                resolve({ success: true, user: result.user });
                            } else {
                                throw new Error(result.message || 'Google authentication failed');
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        console.log('Google prompt dismissed or not shown');
                        // Fallback to popup
                        google.accounts.id.renderButton(
                            document.getElementById('google-signin-button'),
                            { theme: 'outline', size: 'large', text: 'signin_with', width: 300 }
                        );
                    }
                });
            });
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Logout
    async logout() {
        try {
            // Optional: Call backend to invalidate token
            if (this.isAuthenticated()) {
                await API.logout().catch(err => console.warn('Logout API call failed:', err));
            }

            this.clearAuth();

            // Redirect to home or login page
            if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
                window.location.href = '/index.html';
            } else {
                window.location.reload();
            }

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Clear auth anyway
            this.clearAuth();
            return { success: false, error: error.message };
        }
    },

    // Check token expiration (optional enhancement)
    isTokenExpired() {
        const loginTime = localStorage.getItem('fokus_login_time');
        if (!loginTime) return true;

        const now = new Date();
        const loginDate = new Date(loginTime);
        const hoursDiff = (now - loginDate) / 1000 / 60 / 60;

        // Token expires after 24 hours
        return hoursDiff > 24;
    },

    // Update user profile
    updateUser(userData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;

        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('fokus_user', JSON.stringify(updatedUser));
        return true;
    },

    // Check and refresh auth state
    checkAuthState() {
        if (this.isAuthenticated() && this.isTokenExpired()) {
            console.log('Token expired, logging out...');
            this.logout();
            return false;
        }
        return this.isAuthenticated();
    }
};

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check auth state
    Auth.checkAuthState();

    // Update UI based on auth state
    updateAuthUI();
});

// Update UI elements based on authentication state
function updateAuthUI() {
    const isLoggedIn = Auth.isAuthenticated();
    const user = Auth.getCurrentUser();

    // Find auth-related elements
    const loginButtons = document.querySelectorAll('[data-auth="login-btn"]');
    const logoutButtons = document.querySelectorAll('[data-auth="logout-btn"]');
    const userMenus = document.querySelectorAll('[data-auth="user-menu"]');
    const userNames = document.querySelectorAll('[data-auth="user-name"]');
    const userAvatars = document.querySelectorAll('[data-auth="user-avatar"]');

    if (isLoggedIn && user) {
        // Hide login buttons, show logout
        loginButtons.forEach(btn => btn.classList.add('hidden'));
        logoutButtons.forEach(btn => btn.classList.remove('hidden'));
        userMenus.forEach(menu => menu.classList.remove('hidden'));

        // Update user info
        userNames.forEach(el => el.textContent = user.name || user.email);
        userAvatars.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=1e3a8a&color=fff`;
            }
        });
    } else {
        // Show login buttons, hide logout
        loginButtons.forEach(btn => btn.classList.remove('hidden'));
        logoutButtons.forEach(btn => btn.classList.add('hidden'));
        userMenus.forEach(menu => menu.classList.add('hidden'));
    }
}

// Attach logout to global logout buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-auth="logout-btn"]')) {
        e.preventDefault();
        Auth.logout();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
