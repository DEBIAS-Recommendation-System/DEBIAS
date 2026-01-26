import { LoginRequest, SignupRequest, TokenResponse, ApiResponse, User } from '@/types/fastapi.types';
import { dummyUsers, delay, authHelpers } from '@/data/dummyData';

export const authApi = {
  /**
   * Login user with username and password
   * Returns access and refresh tokens
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    await delay(400);
    
    const success = authHelpers.login(credentials.username, credentials.password);
    
    if (!success) {
      throw new Error('Invalid username or password');
    }

    const tokenResponse: TokenResponse = {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 5400, // 90 minutes
    };

    // Store tokens in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      localStorage.setItem('token_type', tokenResponse.token_type);
      localStorage.setItem('current_user', JSON.stringify(authHelpers.getCurrentUser()));
    }

    return tokenResponse;
  },

  /**
   * Sign up new user
   */
  async signup(userData: SignupRequest): Promise<ApiResponse<User>> {
    await delay(500);
    
    // Mock signup - create new user
    const newUser: User = {
      id: dummyUsers.length + 1,
      username: userData.username,
      email: userData.email,
      full_name: userData.full_name,
      password: 'hashed_' + userData.password,
      role: 'user',
      is_active: true,
      created_at: new Date().toISOString(),
      carts: [],
    };
    
    console.log('Mock: User created', newUser);
    
    return {
      message: 'User created successfully',
      data: newUser,
    };
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    await delay(200);
    
    const tokenResponse: TokenResponse = {
      access_token: 'mock_access_token_refreshed_' + Date.now(),
      refresh_token: 'mock_refresh_token_refreshed_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 5400,
    };

    // Update stored tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    }

    return tokenResponse;
  },

  /**
   * Logout user (clear tokens)
   */
  logout(): void {
    authHelpers.logout();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('current_user');
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },
};
