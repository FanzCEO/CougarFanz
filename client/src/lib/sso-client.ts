/**
 * FanzSSO Client Library
 * Provides authentication utilities for all FANZ platforms
 */

const SSO_BASE_URL = import.meta.env.VITE_SSO_URL || 'https://sso.fanz.foundation';
const PLATFORM_ID = import.meta.env.VITE_PLATFORM_ID || 'unknown';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  platform_access: string[];
  creator_status?: string;
  age_verified: boolean;
  roles: string[];
}

interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

interface ValidationResponse {
  valid: boolean;
  user?: User;
  expires_at?: string;
}

class FanzSSOClient {
  private baseUrl: string;
  private platformId: string;

  constructor(baseUrl?: string, platformId?: string) {
    this.baseUrl = baseUrl || SSO_BASE_URL;
    this.platformId = platformId || PLATFORM_ID;
  }

  /**
   * Get the authorization URL for SSO login
   */
  async getAuthorizationUrl(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/platforms/${this.platformId}/authorize`);
    const data = await response.json();
    return data.authorization_url;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, platform: this.platformId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  /**
   * Validate an access token
   */
  async validateToken(token: string): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.json();
  }

  /**
   * Refresh an access token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; expires_in: number }> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  /**
   * Logout from SSO
   */
  async logout(token: string): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include'
    });
  }

  /**
   * Get user profile from SSO
   */
  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.platformId,
        redirect_uri: `${window.location.origin}/auth/callback`
      })
    });

    if (!response.ok) {
      throw new Error('OAuth callback failed');
    }

    const tokenData = await response.json();

    // Validate and get user info
    const validation = await this.validateToken(tokenData.access_token);

    return {
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      user: validation.user!,
      expires_in: tokenData.expires_in
    };
  }

  /**
   * Check if user has access to this platform
   */
  hasPlatformAccess(user: User): boolean {
    return user.platform_access.includes(this.platformId) ||
           user.platform_access.includes('all');
  }

  /**
   * Check if user is age verified
   */
  isAgeVerified(user: User): boolean {
    return user.age_verified === true;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: User, role: string): boolean {
    return user.roles.includes(role) || user.roles.includes('admin');
  }
}

// Export singleton instance
export const ssoClient = new FanzSSOClient();

// Export class for custom instances
export { FanzSSOClient };
export type { User, AuthResponse, ValidationResponse };
