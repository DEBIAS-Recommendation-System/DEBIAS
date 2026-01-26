import { User, ApiResponse } from '@/types/fastapi.types';
import { delay, authHelpers } from '@/data/dummyData';

interface AccountUpdate {
  username: string;
  email: string;
  full_name: string;
}

export const accountApi = {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    await delay(200);
    
    const currentUser = authHelpers.getCurrentUser();
    
    // Try to get from localStorage if not in memory
    if (!currentUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        authHelpers.setCurrentUser(user);
        return {
          message: 'Profile retrieved successfully',
          data: user,
        };
      }
    }
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    return {
      message: 'Profile retrieved successfully',
      data: currentUser,
    };
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: AccountUpdate): Promise<ApiResponse<User>> {
    await delay(400);
    
    const currentUser = authHelpers.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const updatedUser = { ...currentUser, ...data };
    authHelpers.setCurrentUser(updatedUser);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
    }
    
    console.log('Mock: Profile updated', updatedUser);
    
    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  },

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<ApiResponse<User>> {
    await delay(400);
    
    const currentUser = authHelpers.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    console.log('Mock: Account deleted', currentUser.id);
    authHelpers.logout();
    
    return {
      message: 'Account deleted successfully',
      data: currentUser,
    };
  },
};
