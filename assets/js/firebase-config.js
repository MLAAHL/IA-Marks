/**
 * Firebase Configuration for IA-MARKS MANAGEMENT
 * Loads configuration from environment variables or fallback config
 */

(function() {
    'use strict';

    // Firebase configuration object
    const firebaseConfig = {
        apiKey: "AIzaSyDmvzNuE-szbAkFjeEjCNFJK-65sC0_IfE",
        authDomain: "smart-attendance-a9ab4.firebaseapp.com",
        projectId: "smart-attendance-a9ab4",
        storageBucket: "smart-attendance-a9ab4.firebasestorage.app",
        messagingSenderId: "447867381654",
        appId: "1:447867381654:web:e27e6cceb8c63c0c799fb7",
        measurementId: "G-19HPME0K12"
    };

    // API Configuration
    const apiConfig = {
        baseURL: "http://localhost:5000/api",
        mongoUri: "mongodb+srv://skanda:umesh@cluster0.71icrb5.mongodb.net/IA?retryWrites=true&w=majority&appName=Cluster0"
    };

    // Validate Firebase configuration
    function validateFirebaseConfig(config) {
        const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
        const missing = requiredFields.filter(field => !config[field]);
        
        if (missing.length > 0) {
            console.error('Missing Firebase configuration fields:', missing);
            return false;
        }
        return true;
    }

    // Initialize configuration
    function initializeConfig() {
        if (!validateFirebaseConfig(firebaseConfig)) {
            throw new Error('Invalid Firebase configuration');
        }

        // Make configs globally available
        window.FIREBASE_CONFIG = firebaseConfig;
        window.API_CONFIG = apiConfig;

        // Dispatch event that config is loaded
        window.dispatchEvent(new CustomEvent('firebaseConfigLoaded', {
            detail: { config: firebaseConfig, apiConfig: apiConfig }
        }));

        console.log('Firebase configuration loaded successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeConfig);
    } else {
        initializeConfig();
    }

})();
