/**
 * WSO2 Authentication Models
 * OAuth2 and DCR related types
 */

/**
 * DCR Registration Request
 */
export interface DCRRequest {
  callbackUrl?: string;
  clientName: string;
  owner?: string;
  grantType: string;
  saasApp?: boolean;
}

/**
 * DCR Registration Response
 */
export interface DCRResponse {
  clientId: string;
  clientName: string;
  callBackURL?: string;
  clientSecret: string;
  isSaasApplication?: boolean;
  appOwner?: string;
  jsonString?: string;
  jsonAppAttribute?: string;
  tokenType?: string;
}

/**
 * OAuth2 Token Request
 */
export interface TokenRequest {
  grant_type: 'password' | 'client_credentials' | 'refresh_token';
  username?: string;
  password?: string;
  refresh_token?: string;
  scope?: string;
}

/**
 * OAuth2 Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
  expires_in: number;
}

/**
 * User Info Response
 */
export interface UserInfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  picture?: string;
}

/**
 * Stored Auth State
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: UserInfo;
  clientId?: string;
  clientSecret?: string;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}