import { LogLevel } from '@azure/msal-browser';
import type { Configuration } from '@azure/msal-browser';

// ============================================================
// AZURE AD CONFIGURATION - HOC Internal Dashboard
// ============================================================

// Your Azure AD App Registration values
export const AZURE_CLIENT_ID = 'bafc7170-b610-464e-891e-6014e0d6dc08';
export const AZURE_TENANT_ID = '19c5fbd0-b817-4474-a78b-2d48ff2c5ec5';

// Redirect URI (your Vercel deployment)
export const REDIRECT_URI = 'https://hoc-internal-dashboard.vercel.app';

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
