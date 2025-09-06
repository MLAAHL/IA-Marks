// assets/js/auth.js
let auth;
let isFirebaseReady = false;

// Wait for Firebase to be ready
window.addEventListener('firebaseReady', () => {
    auth = window.auth;
    isFirebaseReady = true;
    
    // Update connection status
    document.getElementById('connectionStatus').innerHTML = 
        '<i class="fas fa-circle text-green-500 mr-1"></i>Connected to Firebase';
    
    // Enable sign in button
    document.getElementById('signInBtn').disabled = false;
    
    // Check if user is already logged in
    checkAuthState();
});

// Check authentication state
function checkAuthState() {
    window.firebaseAuth.onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is signed in:', user.email);
            await handleUserLogin(user);
        } else {
            console.log('User is signed out');
        }
    });
}

// Handle successful Firebase login
async function handleUserLogin(firebaseUser) {
    try {
        showLoading(true);
        
        // Get Firebase ID token
        const idToken = await firebaseUser.getIdToken();
        
        // Check if teacher exists in database or create new one
        const response = await fetch('/api/teachers/checkOrCreate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                photoURL: firebaseUser.photoURL || '',
                phoneNumber: firebaseUser.phoneNumber || ''
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert('success', result.message);
            
            // Store teacher info in localStorage
            localStorage.setItem('teacherData', JSON.stringify({
                mongoId: result.data._id,
                firebaseUid: result.data.firebaseUid,
                name: result.data.name,
                email: result.data.email,
                hasSelectedSubjects: result.data.createdSubjects.length > 0,
                loginTime: Date.now()
            }));
            
            // Redirect based on whether teacher has selected subjects
            setTimeout(() => {
                if (result.data.createdSubjects.length > 0) {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/subject-selection.html';
                }
            }, 1500);
            
        } else {
            showAlert('error', 'Failed to store user data: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error handling login:', error);
        showAlert('error', 'Login processing failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const keepSignedIn = document.getElementById('keepSignedIn');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' 
            ? '<i class="fas fa-eye"></i>' 
            : '<i class="fas fa-eye-slash"></i>';
    });

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isFirebaseReady) {
            showAlert('error', 'Firebase is not ready. Please wait and try again.');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showAlert('error', 'Please enter both email and password.');
            return;
        }
        
        try {
            showLoading(true);
            
            // Set persistence based on "Keep me signed in" checkbox
            const persistence = keepSignedIn.checked 
                ? window.firebaseAuthPersistence.browserLocalPersistence 
                : window.firebaseAuthPersistence.browserSessionPersistence;
                
            await window.firebaseAuthPersistence.setPersistence(auth, persistence);
            
            // Sign in with Firebase
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(auth, email, password);
            console.log('Firebase login successful:', userCredential.user.email);
            
            // handleUserLogin will be called automatically by onAuthStateChanged
            
        } catch (error) {
            console.error('Login error:', error);
            showLoading(false);
            
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = error.message || 'Login failed. Please try again.';
            }
            
            showAlert('error', errorMessage);
        }
    });
});

// Utility functions
function showLoading(show) {
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const signInBtn = document.getElementById('signInBtn');
    
    if (show) {
        btnText.textContent = 'Signing In...';
        loadingSpinner.classList.remove('hidden');
        signInBtn.disabled = true;
    } else {
        btnText.textContent = 'Sign In';
        loadingSpinner.classList.add('hidden');
        signInBtn.disabled = false;
    }
}

function showAlert(type, message) {
    const alertDiv = document.getElementById('alertMessage');
    const alertText = document.getElementById('alertText');
    
    alertDiv.className = `mb-4 p-3 rounded-lg alert-message ${
        type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
    }`;
    
    alertText.textContent = message;
    alertDiv.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 5000);
}
