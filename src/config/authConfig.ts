import { Configuration, LogLevel } from '@azure/msal-browser';

// ============================================================
// AZURE AD CONFIGURATION
// ============================================================
// You need to register an app in Azure Portal and fill in these values:
// 1. Go to https://portal.azure.com
// 2. Search "App registrations" → New registration
// 3. Name: "HOC Internal Dashboard"
// 4. Account type: "Accounts in this organizational directory only"
// 5. Redirect URI: "Single-page application (SPA)" → your Vercel URL
// 6. Copy the Client ID and Tenant ID below
// ============================================================

// REPLACE THESE WITH YOUR VALUES FROM AZURE PORTAL
export const AZURE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Application (client) ID
export const AZURE_TENANT_ID = 'YOUR_TENANT_ID_HERE'; // Directory (tenant) ID

// Your Vercel deployment URL (update this after deployment)
export const REDIRECT_URI = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:5173';

// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          default:
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

// Scopes for login - basic user profile info
export const loginRequest = {
  scopes: ['User.Read'],
};

// Check if Azure AD is configured
export const isAzureConfigured = () => {
  return AZURE_CLIENT_ID !== 'YOUR_CLIENT_ID_HERE' && 
         AZURE_TENANT_ID !== 'YOUR_TENANT_ID_HERE';
};

