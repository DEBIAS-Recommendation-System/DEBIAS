import {
  Product,
  ProductCreate,
  ProductUpdate,
  ApiResponse,
  ApiListResponse,
  ProductSearchParams,
  DebiasSearchParams,
} from '@/types/fastapi.types';
import { 
  dummyProducts, 
  delay, 
  getProductById, 
  searchProducts, 
  getHubProducts,
  getProductsByCategory 
} from '@/data/dummyData';

export const productsApi = {
  /**
   * Get all products with pagination and search
   */
  async getProducts(params?: ProductSearchParams): Promise<ApiListResponse<Product>> {
    await delay(300);
    
    let products = [...dummyProducts];
    
    // Apply search filter
    if (params?.search) {
      products = searchProducts(params.search);
    }
    
    // Apply category filter
    if (params?.category_id) {
      products = products.filter(p => p.category_id === params.category_id);
    }
    
    // Apply price filters
    if (params?.min_price) {
      products = products.filter(p => p.price >= params.min_price!);
    }
    if (params?.max_price) {
      products = products.filter(p => p.price <= params.max_price!);
    }
    
    // Apply sorting
    if (params?.sort_by) {
      products.sort((a, b) => {
        const order = params.sort_order === 'desc' ? -1 : 1;
        switch (params.sort_by) {
          case 'price':
            return order * (a.price - b.price);
          case 'rating':
            return order * (a.rating - b.rating);
          case 'created_at':
            return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          default:
            return 0;
        }
      });
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + limit);
    
    return {
      message: 'Products retrieved successfully',
      data: paginatedProducts,
    };
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    await delay(200);
    
    const product = getProductById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  },

  /**
   * Create new product (admin only)
   */
  async createProduct(product: ProductCreate): Promise<ApiResponse<Product>> {
    await delay(400);
    
    // Mock creation - in real app this would add to database
    const newProduct: Product = {
      id: dummyProducts.length + 1,
      ...product,
      category: { id: product.category_id, name: 'New Category' },
    };
    
    console.log('Mock: Product created', newProduct);
    
    return {
      message: 'Product created successfully',
      data: newProduct,
    };
  },

  /**
   * Update existing product (admin only)
   */
  async updateProduct(id: number, product: ProductUpdate): Promise<ApiResponse<Product>> {
    await delay(400);
    
    const existingProduct = getProductById(id);
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    // Mock update
    const updatedProduct = { ...existingProduct, ...product };
    console.log('Mock: Product updated', updatedProduct);
    
    return {
      message: 'Product updated successfully',
      data: updatedProduct,
    };
  },

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id: number): Promise<ApiResponse<Product>> {
    await delay(400);
    
    const product = getProductById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    
    console.log('Mock: Product deleted', id);
    
    return {
      message: 'Product deleted successfully',
      data: product,
    };
  },

  /**
   * DEBIAS: Search products with semantic search and budget constraint
   */
  async debiasSearch(params: DebiasSearchParams): Promise<ApiListResponse<Product>> {
    await delay(500);
    
    let products = searchProducts(params.query);
    
    // Apply budget filter
    if (params.budget) {
      products = products.filter(p => p.price <= params.budget!);
    }
    
    // Apply category filter
    if (params.category_id) {
      products = products.filter(p => p.category_id === params.category_id);
    }
    
    // Apply limit
    const limit = params.limit || 20;
    products = products.slice(0, limit);
    
    return {
      message: 'DEBIAS search completed successfully',
      data: products,
    };
  },

  /**
   * Get hub products (popular starter products for cold start)
   */
  async getHubProducts(limit: number = 20): Promise<ApiListResponse<Product>> {
    await delay(300);
    
    const hubProducts = getHubProducts().slice(0, limit);
    
    return {
      message: 'Hub products retrieved successfully',
      data: hubProducts,
    };
  },
};
