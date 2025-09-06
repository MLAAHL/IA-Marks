/**
 * IA-MARKS MANAGEMENT Login System with Firebase Integration
 * Enhanced login functionality with Firebase Authentication
 */

class LoginManager {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.signInBtn = document.getElementById('signInBtn');
        this.btnText = document.getElementById('btnText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.alertMessage = document.getElementById('alertMessage');
        this.alertText = document.getElementById('alertText');
        this.forgotPasswordBtn = document.getElementById('forgotPassword');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupValidation();
        this.checkStoredCredentials();
        this.checkExistingSession();
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Password toggle
        this.togglePasswordBtn.addEventListener('click', () => this.togglePassword());
        
        // Forgot password
        this.forgotPasswordBtn.addEventListener('click', (e) => this.handleForgotPassword(e));
        
        // Input field animations
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.handleInputFocus(e));
            input.addEventListener('blur', (e) => this.handleInputBlur(e));
            input.addEventListener('input', (e) => this.handleInputChange(e));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupValidation() {
        // Real-time email validation
        this.emailInput.addEventListener('input', () => {
            this.validateEmail();
        });

        // Password strength indicator
        this.passwordInput.addEventListener('input', () => {
            this.validatePassword();
        });
    }

    checkStoredCredentials() {
        // Check if user chose to stay signed in
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            this.emailInput.value = rememberedEmail;
            document.getElementById('keepSignedIn').checked = true;
        }
    }

    checkExistingSession() {
        // If the user explicitly logged out, do not auto-login
        if (localStorage.getItem('userLoggedOut') === 'true') {
            // A logout was initiated. Finalize it here: ensure Firebase is signed out and
            // clear any remaining session/persistence, then remove the flag so future checks behave normally.
            (async () => {
                try {
                    // Clear local session storage first
                    localStorage.removeItem('userSession');
                    localStorage.removeItem('rememberedEmail');
                    localStorage.removeItem('ia-marks-subjects');
                    localStorage.removeItem('currentSubject');
                    sessionStorage.clear();

                    // Clear Firebase persistence if available via modular API (prefer in-memory persistence)
                    try {
                        if (window.firebaseAuthPersistence && window.auth) {
                            const { setPersistence, inMemoryPersistence } = window.firebaseAuthPersistence;
                            await setPersistence(window.auth, inMemoryPersistence);
                        }
                    } catch (pErr) {
                        console.log('Could not set persistence to in-memory (continuing):', pErr);
                    }

                    // Ensure Firebase signs out
                    if (window.firebaseAuth && window.auth) {
                        try {
                            await window.firebaseAuth.signOut(window.auth);
                        } catch (soErr) {
                            console.log('Firebase signOut during finalize logout failed (continuing):', soErr);
                        }
                    }
                } catch (err) {
                    console.error('Error finalizing logout:', err);
                } finally {
                    // Remove the flag so normal auto-login checks can resume
                    localStorage.removeItem('userLoggedOut');
                }
            })();

            // Do not attempt auto-login while finalization runs
            return;
        }

        // Prefer Firebase auth state if available (prevents auto-login when Firebase has no currentUser)
        if (window.firebaseAuthManager && window.firebaseAuthManager.isAuthenticated()) {
            // Firebase reports a signed-in user; redirect to dashboard
            this.showAlert('Existing authenticated session detected. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 800);
            return;
        }

        // Fallback: check if a valid local session exists and remember-me was selected
        const userSession = localStorage.getItem('userSession');
        if (userSession && localStorage.getItem('rememberedEmail')) {
            try {
                const session = JSON.parse(userSession);
                const lastLogin = new Date(session.lastLoginAt);
                const now = new Date();
                const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);

                // If logged in within last 24 hours
                if (hoursSinceLogin < 24) {
                    this.showAlert('Previous session found. Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1200);
                }
            } catch (error) {
                // Clear invalid session data
                localStorage.removeItem('userSession');
            }
        }
}


    async handleSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();
        const keepSignedIn = document.getElementById('keepSignedIn').checked;

        // Validate form
        if (!this.validateForm(email, password)) {
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            // Persist the user's 'remember me' preference before sign-in so the auth module
            // can read it and set Firebase persistence appropriately.
            if (keepSignedIn) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Use Firebase Authentication
            const result = await window.firebaseAuthManager.signInWithEmail(email, password);
            
            if (result.success) {
                // Store email if remember me is checked
                if (keepSignedIn) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                this.showAlert('Login successful! Redirecting to dashboard...', 'success');
                
                // Firebase auth manager handles redirect
            } else {
                this.showAlert(result.error, 'error');
                
                // Special handling for specific errors
                if (result.errorCode === 'auth/user-not-found') {
                    this.suggestAccountCreation();
                }
            }
        } catch (error) {
            this.showAlert('Network error. Please check your connection and try again.', 'error');
            console.error('Login error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        
        if (!email) {
            this.showAlert('Please enter your email address first', 'error');
            this.emailInput.focus();
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.setLoadingState(true, 'Sending reset email...');
            
            const result = await window.firebaseAuthManager.sendPasswordResetEmail(email);
            
            if (result.success) {
                this.showAlert(`Password reset email sent to ${email}. Please check your inbox.`, 'success');
            } else {
                this.showAlert(result.error, 'error');
            }
        } catch (error) {
            this.showAlert('Failed to send reset email. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    suggestAccountCreation() {
        const createAccountBtn = document.getElementById('createAccount');
        if (createAccountBtn) {
            createAccountBtn.textContent = 'Account not found - Contact administrator';
            createAccountBtn.classList.add('text-red-600', 'font-medium');
        }
    }

    validateForm(email, password) {
        if (!email || !password) {
            this.showAlert('Please fill in all required fields', 'error');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return false;
        }

        return true;
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const isValid = this.isValidEmail(email);
        
        if (email && !isValid) {
            this.emailInput.classList.add('border-red-300');
            this.emailInput.classList.remove('border-gray-300');
        } else {
            this.emailInput.classList.remove('border-red-300');
            this.emailInput.classList.add('border-gray-300');
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const strength = this.getPasswordStrength(password);
        
        // Add visual feedback for password strength
        this.passwordInput.classList.remove('border-red-300', 'border-yellow-300', 'border-green-300');
        
        if (password.length > 0) {
            if (strength === 'weak') {
                this.passwordInput.classList.add('border-red-300');
            } else if (strength === 'medium') {
                this.passwordInput.classList.add('border-yellow-300');
            } else if (strength === 'strong') {
                this.passwordInput.classList.add('border-green-300');
            }
        }
    }

    getPasswordStrength(password) {
        if (password.length < 6) return 'weak';
        if (password.length < 8) return 'medium';
        
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        
        if (criteriaCount >= 3) return 'strong';
        return 'medium';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.togglePasswordBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    }

    setLoadingState(loading, customText = null) {
        this.signInBtn.disabled = loading;
        
        if (loading) {
            this.btnText.textContent = customText || 'Signing In...';
            this.loadingSpinner.classList.remove('hidden');
            this.signInBtn.classList.add('loading');
        } else {
            this.btnText.textContent = 'Sign In';
            this.loadingSpinner.classList.add('hidden');
            this.signInBtn.classList.remove('loading');
        }
    }

    showAlert(message, type = 'error') {
        this.alertMessage.className = `mb-4 p-3 rounded-lg alert-message alert-${type}`;
        this.alertText.textContent = message;
        this.alertMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds for success messages, 7 seconds for errors
        const hideDelay = type === 'success' ? 5000 : 7000;
        setTimeout(() => {
            this.hideAlert();
        }, hideDelay);
    }

    hideAlert() {
        this.alertMessage.classList.add('hidden');
    }

    handleInputFocus(e) {
        e.target.parentElement.classList.add('focused');
    }

    handleInputBlur(e) {
        e.target.parentElement.classList.remove('focused');
    }

    handleInputChange(e) {
        // Clear any existing alerts when user starts typing
        if (!this.alertMessage.classList.contains('hidden')) {
            this.hideAlert();
        }
    }

    handleKeyboard(e) {
        // Escape key to clear form
        if (e.key === 'Escape') {
            this.clearForm();
        }
        
        // Ctrl+Enter to submit
        if (e.ctrlKey && e.key === 'Enter') {
            this.form.dispatchEvent(new Event('submit'));
        }
    }

    clearForm() {
        this.form.reset();
        this.hideAlert();
        this.emailInput.focus();
    }
}

// Initialize the login manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});

// Handle page visibility changes (for security)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - could implement additional security measures
        console.log('Page hidden - session tracking paused');
    } else {
        // Page is visible - refresh auth state
        console.log('Page visible - checking auth state');
        if (window.firebaseAuthManager) {
            const user = window.firebaseAuthManager.getCurrentUser();
            if (user) {
                console.log('User still authenticated:', user.email);
            }
        }
    }
});
