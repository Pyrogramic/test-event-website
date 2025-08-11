// Authentication JavaScript
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const loginData = {
            userId: formData.get('userId'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/dashboard';
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            if (window.location.pathname === '/dashboard') {
                window.location.href = '/login';
            }
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Update UI for authenticated user
                this.updateAuthenticatedUI(data.user);
            } else {
                this.handleLogout();
            }
        } catch (error) {
            console.error('Auth verification error:', error);
            this.handleLogout();
        }
    }

    updateAuthenticatedUI(user) {
        const navUser = document.getElementById('navUser');
        if (navUser) {
            navUser.textContent = `${user.role.toUpperCase()}: ${user.userId}`;
        }

        // Add owner class to body if user is owner
        if (user.role === 'owner') {
            document.body.classList.add('owner');
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: var(--error);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        `;
        errorDiv.textContent = message;

        // Insert error message
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.insertBefore(errorDiv, loginForm.firstChild);
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});