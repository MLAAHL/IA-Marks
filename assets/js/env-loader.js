/**
 * Environment Variables Loader
 * Fetches environment variables from the server and makes them available globally
 */

(function() {
    'use strict';

    // Function to load environment variables from server
    async function loadEnvironmentVariables() {
        try {
            const response = await fetch('/api/env');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const envVars = await response.json();
            
            // Make environment variables globally available
            window.ENV = envVars;
            
            // Dispatch event that environment variables are loaded
            window.dispatchEvent(new CustomEvent('envLoaded', {
                detail: envVars
            }));
            
            console.log('✅ Environment variables loaded successfully');
            return envVars;
            
        } catch (error) {
            console.error('❌ Failed to load environment variables:', error);
            
            // Fallback to empty object if loading fails
            window.ENV = {};
            
            // Still dispatch event so dependent scripts can continue
            window.dispatchEvent(new CustomEvent('envLoaded', {
                detail: {}
            }));
            
            throw error;
        }
    }

    // Load environment variables when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadEnvironmentVariables);
    } else {
        loadEnvironmentVariables();
    }

})();
