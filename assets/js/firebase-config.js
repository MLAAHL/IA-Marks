/**
 * Firebase Configuration for IA-MARKS MANAGEMENT
 * Loads configuration from environment variables or fallback config
 */

(function() {
    'use strict';

    // Firebase configuration object - loaded from environment variables
    const firebaseConfig = {
        apiKey: window.ENV?.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmvzNuE-szbAkFjeEjCNFJK-65sC0_IfE",
        authDomain: window.ENV?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "smart-attendance-a9ab4.firebaseapp.com",
        projectId: window.ENV?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "smart-attendance-a9ab4",
        storageBucket: window.ENV?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "smart-attendance-a9ab4.firebasestorage.app",
        messagingSenderId: window.ENV?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "447867381654",
        appId: window.ENV?.NEXT_PUBLIC_FIREBASE_APP_ID || "1:447867381654:web:e27e6cceb8c63c0c799fb7",
        measurementId: window.ENV?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-19HPME0K12"
    };

    // API Configuration - loaded from environment variables
    const apiConfig = {
        baseURL: window.ENV?.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
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
        // Update config with loaded environment variables
        const updatedFirebaseConfig = {
            apiKey: window.ENV?.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey,
            authDomain: window.ENV?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
            projectId: window.ENV?.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
            storageBucket: window.ENV?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
            messagingSenderId: window.ENV?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
            appId: window.ENV?.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseConfig.appId,
            measurementId: window.ENV?.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId
        };

        const updatedApiConfig = {
            baseURL: window.ENV?.NEXT_PUBLIC_API_URL || apiConfig.baseURL
        };

        if (!validateFirebaseConfig(updatedFirebaseConfig)) {
            throw new Error('Invalid Firebase configuration');
        }

        // Make configs globally available
        window.FIREBASE_CONFIG = updatedFirebaseConfig;
        window.API_CONFIG = updatedApiConfig;

        // Dispatch event that config is loaded
        window.dispatchEvent(new CustomEvent('firebaseConfigLoaded', {
            detail: { config: updatedFirebaseConfig, apiConfig: updatedApiConfig }
        }));

        console.log('Firebase configuration loaded successfully');
    }

    // Wait for environment variables to be loaded before initializing
    if (window.ENV) {
        // Environment variables already loaded
        initializeConfig();
    } else {
        // Wait for environment variables to load
        window.addEventListener('envLoaded', initializeConfig);
    }

})();
