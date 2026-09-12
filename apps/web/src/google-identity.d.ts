interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon';

  theme?:
    | 'outline'
    | 'filled_blue'
    | 'filled_black';

  size?:
    | 'large'
    | 'medium'
    | 'small';

  text?:
    | 'signin_with'
    | 'signup_with'
    | 'continue_with';

  shape?:
    | 'rectangular'
    | 'pill'
    | 'circle'
    | 'square';

  width?: number;
}

interface GoogleIdentityConfiguration {
  client_id: string;

  callback: (
    response: GoogleCredentialResponse
  ) => void;
}

interface GoogleIdentityApi {
  initialize(
    configuration:
      GoogleIdentityConfiguration
  ): void;

  renderButton(
    parent: HTMLElement,

    configuration:
      GoogleButtonConfiguration
  ): void;

  disableAutoSelect(): void;
}

/**
 * Response returned after the traveler grants
 * Google Photos access.
 */
interface GoogleOAuthTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

/**
 * Browser-level OAuth errors, such as a popup
 * being closed before authorization finishes.
 */
interface GoogleOAuthError {
  type: string;
}

interface GoogleTokenClientConfiguration {
  client_id: string;
  scope: string;

  include_granted_scopes?: boolean;

  callback: (
    response:
      GoogleOAuthTokenResponse
  ) => void;

  error_callback?: (
    error: GoogleOAuthError
  ) => void;
}

interface GoogleTokenRequestConfiguration {
  prompt?:
    | ''
    | 'none'
    | 'consent'
    | 'select_account';
}

interface GoogleTokenClient {
  requestAccessToken(
    configuration?:
      GoogleTokenRequestConfiguration
  ): void;
}

interface GoogleOAuth2Api {
  initTokenClient(
    configuration:
      GoogleTokenClientConfiguration
  ): GoogleTokenClient;

  revoke(
    accessToken: string,
    callback: () => void
  ): void;
}

interface GoogleIdentityServices {
  accounts: {
    id: GoogleIdentityApi;
    oauth2: GoogleOAuth2Api;
  };
}

interface Window {
  google?:
    GoogleIdentityServices;
}