function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000';
  }
  
  return 'http://127.0.0.1:5000';
}

const API_BASE_URL = getApiBaseUrl();

if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[API] Backend URL:', API_BASE_URL);
}

export interface ProductData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  images: string[];
  oldPrice: number | string;
  basePrice: number | string;
  createdAt: string;
  updatedAt: string;
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface ProductsResponse {
  success: boolean;
  data: ProductData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ProductResponse {
  success: boolean;
  data: ProductData;
}

export async function fetchAllProducts(params?: {
  page?: number;
  limit?: number;
  tags?: string[];
}): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.tags && params.tags.length > 0) {
    queryParams.append('tags', params.tags.join(','));
  }

  const url = `${API_BASE_URL}/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [${response.status}]: ${errorText}`);
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Attempted URL:', url);
    throw error;
  }
}

export async function fetchProductBySlug(slug: string): Promise<ProductResponse> {
  const url = `${API_BASE_URL}/api/products/${slug}`;
  
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [${response.status}]: ${errorText}`);
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Attempted URL:', url);
    throw error;
  }
}

