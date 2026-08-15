interface GoogleCredentialResponse {
    credential: string;
    select_by: string;
  }
  
  interface GoogleButtonConfiguration {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
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
      configuration: GoogleIdentityConfiguration
    ): void;
  
    renderButton(
      parent: HTMLElement,
      configuration: GoogleButtonConfiguration
    ): void;
  
    disableAutoSelect(): void;
  }
  
  interface GoogleIdentityServices {
    accounts: {
      id: GoogleIdentityApi;
    };
  }
  
  interface Window {
    google?: GoogleIdentityServices;
  }