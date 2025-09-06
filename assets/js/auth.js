/**
 * Firebase Authentication Handler for IA-MARKS MANAGEMENT
 * Handles all Firebase authentication operations
 */

class FirebaseAuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isFirebaseReady = false;
        
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        window.addEventListener('firebaseReady', () => {
            this.auth = window.auth;
            this.isFirebaseReady = true;
            this.setupAuthStateListener();
            this.updateConnectionStatus('connected');
            this.enableLoginForm();
            console.log('Firebase Auth initialized successfully');
        });

        // Handle Firebase initialization errors
        setTimeout(() => {
            if (!this.isFirebaseReady) {
                this.updateConnectionStatus('error');
                console.error('Firebase initialization timeout');
            }
        }, 10000);
    }

    setupAuthStateListener() {
    window.firebaseAuth.onAuthStateChanged(this.auth, (user) => {
        // If a logout was initiated in another tab, avoid triggering auto-login behavior here.
        // Do NOT remove the flag here; let the login page finalize the logout and clear it.
        if (localStorage.getItem('userLoggedOut') === 'true') {
            return;
        }

        this.currentUser = user;
        if (user) {
            console.log('User is signed in:', user.email);
            this.handleAuthSuccess(user);
        } else {
            console.log('User is signed out');
        }
    });
}


    async signInWithEmail(email, password) {
        if (!this.isFirebaseReady) {
            throw new Error('Firebase not initialized');
        }

        try {
            // Ensure persistence is set based on whether the user requested 'remember me'.
            try {
                const remember = localStorage.getItem('rememberedEmail') !== null;
                if (window.firebaseAuthPersistence && window.auth) {
                    const { setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } = window.firebaseAuthPersistence;
                    // If user asked to be remembered use local persistence, otherwise session
                    await setPersistence(window.auth, remember ? browserLocalPersistence : sessionStorage ? browserSessionPersistence : inMemoryPersistence);
                }
            } catch (pErr) {
                // If persistence setting fails, continue with sign-in; we'll clear on logout.
                console.log('Could not set persistence (continuing):', pErr);
            }

            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            console.log('Login successful:', user.email);
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    emailVerified: user.emailVerified
                }
            };
        } catch (error) {
            console.error('Firebase Auth Error:', error);
            return {
                success: false,
                error: this.getReadableErrorMessage(error.code),
                errorCode: error.code
            };
        }
    }

    async signOut() {
        if (!this.isFirebaseReady) {
            return;
        }

        try {
            // Before signOut, set persistence to in-memory to avoid persistent session on next load
            try {
                if (window.firebaseAuthPersistence && window.auth) {
                    const { setPersistence, inMemoryPersistence } = window.firebaseAuthPersistence;
                    await setPersistence(window.auth, inMemoryPersistence);
                }
            } catch (pErr) {
                console.log('Could not set in-memory persistence before signOut:', pErr);
            }

            await window.firebaseAuth.signOut(this.auth);
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async sendPasswordResetEmail(email) {
        if (!this.isFirebaseReady) {
            throw new Error('Firebase not initialized');
        }

        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getReadableErrorMessage(error.code) };
        }
    }

    getReadableErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled. Contact administrator.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
            'auth/operation-not-allowed': 'Email/password login is not enabled.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/email-already-in-use': 'An account already exists with this email.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    handleAuthSuccess(user) {
        // Store user session
        const userSession = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            lastLoginAt: new Date().toISOString()
        };

        localStorage.setItem('userSession', JSON.stringify(userSession));
        
        // Redirect to dashboard
        this.redirectToDashboard();
    }

    redirectToDashboard() {
    // Updated redirect to dashboard
    const dashboardUrl = '/dashboard.html';
    
    // Show success message before redirect
    if (window.loginManager) {
        window.loginManager.showAlert('Login successful! Redirecting...', 'success');
    }
    
    setTimeout(() => {
        window.location.href = dashboardUrl;
    }, 1500);
}


    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        switch (status) {
            case 'connecting':
                statusElement.innerHTML = '<i class="fas fa-circle animate-pulse text-yellow-500 mr-1"></i>Connecting to Firebase...';
                statusElement.className = 'mb-4 p-2 rounded text-center text-xs bg-yellow-50 text-yellow-700';
                break;
            case 'connected':
                statusElement.innerHTML = '<i class="fas fa-check-circle text-green-500 mr-1"></i>Connected securely';
                statusElement.className = 'mb-4 p-2 rounded text-center text-xs bg-green-50 text-green-700';
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 3000);
                break;
            case 'error':
                statusElement.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>Connection failed';
                statusElement.className = 'mb-4 p-2 rounded text-center text-xs bg-red-50 text-red-700';
                break;
        }
    }

    enableLoginForm() {
        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.disabled = false;
            signInBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialize Firebase Auth Manager
window.firebaseAuthManager = new FirebaseAuthManager();
