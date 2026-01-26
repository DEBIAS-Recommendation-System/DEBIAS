import { Category, ApiResponse, ApiListResponse } from '@/types/fastapi.types';
import { dummyCategories, delay } from '@/data/dummyData';

export const categoriesApi = {
  /**
   * Get all categories with pagination and search
   */
  async getCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiListResponse<Category>> {
    await delay(200);
    
    let categories = [...dummyCategories];
    
    // Apply search filter
    if (params?.search) {
      const lowerSearch = params.search.toLowerCase();
      categories = categories.filter(c => c.name.toLowerCase().includes(lowerSearch));
    }
    
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  },

  /**
   * Get single category by ID
   */
  async getCategory(id: number): Promise<ApiResponse<Category>> {
    await delay(200);
    
    const category = dummyCategories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  },

  /**
   * Create new category (admin only)
   */
  async createCategory(name: string): Promise<ApiResponse<Category>> {
    await delay(400);
    
    const newCategory: Category = {
      id: dummyCategories.length + 1,
      name,
    };
    
    console.log('Mock: Category created', newCategory);
    
    return {
      message: 'Category created successfully',
      data: newCategory,
    };
  },

  /**
   * Update existing category (admin only)
   */
  async updateCategory(id: number, name: string): Promise<ApiResponse<Category>> {
    await delay(400);
    
    const category = dummyCategories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    const updatedCategory = { ...category, name };
    console.log('Mock: Category updated', updatedCategory);
    
    return {
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  },

  /**
   * Delete category (admin only)
   */
  async deleteCategory(id: number): Promise<ApiResponse<Category>> {
    await delay(400);
    
    const category = dummyCategories.find(c => c.id === id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    console.log('Mock: Category deleted', id);
    
    return {
      message: 'Category deleted successfully',
      data: category,
    };
  },
};
