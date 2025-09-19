export type ApiError = { error: string; details?: string; statusCode?: number };

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'consumer' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'farmer' | 'distributor' | 'consumer';
}

// New: Extended profile & reviews
export type PublicProfile = {
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'consumer' | 'admin';
  createdAt: string;
  profile: {
    location: string;
    experienceYears: number;
    mainCrops: string[];
    specialties: string[];
    avgDealSize: number | null;
    bio: string;
  };
  reviewsSummary: {
    avgRating: number;
    total: number;
  }
};

export type Review = {
  fromEmail: string;
  rating: number; // 1..5
  comment: string;
  dateISO: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// Helper to handle API responses
async function handleJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any;
  
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const err = new Error('Invalid response from server') as any;
    err.statusCode = res.status;
    throw err;
  }
  
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const error: any = new Error(msg);
    error.details = data;
    error.statusCode = res.status;
    throw error;
  }
  
  return data as T;
}

// Auth API functions
export const authApi = {
  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    return handleJson<AuthResponse>(res);
  },

  // Get current user (basic user object)
  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleJson<User>(res);
  },

  // Register new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
    return handleJson<AuthResponse>(res);
  },

  // Get current user public/extended profile
  async getProfile(): Promise<PublicProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleJson<PublicProfile>(res);
  },

  // Update current profile (name and extended fields)
  async updateProfile(data: { 
    name?: string; 
    location?: string; 
    experienceYears?: number; 
    mainCrops?: string[]; 
    specialties?: string[]; 
    avgDealSize?: number; 
    bio?: string; 
  }): Promise<PublicProfile> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleJson<PublicProfile>(res);
  },

  // Logout user
  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  // Refresh access token
  async refreshToken(): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleJson<{ token: string }>(res);
  },

  // Password flows
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleJson<{ message: string }>(res);
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    return handleJson<{ message: string }>(res);
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return handleJson<{ message: string }>(res);
  },
  
  async requestVerificationEmail(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleJson<{ message: string }>(res);
  },

  // Change password (authenticated)
  async changePassword(input: { oldPassword: string; newPassword: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    return handleJson(res);
  },

  // Delete account (authenticated)
  async deleteAccount(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/delete`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleJson(res);
  },
};

// Public profiles & reviews API
export const profilesApi = {
  async getPublicProfile(email: string): Promise<PublicProfile> {
    const res = await fetch(`${API_BASE}/profiles/${encodeURIComponent(email)}`);
    return handleJson(res);
  },
  async getReviews(email: string): Promise<{ reviews: Review[] }> {
    const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(email)}`);
    return handleJson(res);
  },
  async addReview(email: string, input: { rating: number; comment: string }): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    return handleJson(res);
  },
};

// Price visibility control API
export interface PriceRequest {
  id: string;
  batchId: number;
  requesterEmail: string;
  requesterName: string;
  requesterRole: string;
  farmerEmail: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  respondedAt: string | null;
}

export interface PriceRequestStatus {
  hasRequest: boolean;
  requestStatus: string | null;
  hasPermission: boolean;
  canViewPrice: boolean;
}

export interface VisibilitySetting {
  batchId: number;
  priceVisibility: 'public' | 'private';
}

export const priceVisibilityApi = {
  // Request price view access
  async requestPriceAccess(batchId: number): Promise<{ success: boolean; requestId: string; message: string }> {
    const res = await fetch(`${API_BASE}/price-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ batchId }),
    });
    return handleJson(res);
  },

  // Get price requests for farmer
  async getPriceRequests(): Promise<{ requests: PriceRequest[] }> {
    const res = await fetch(`${API_BASE}/price-requests`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleJson(res);
  },

  // Approve/deny price request
  async respondToPriceRequest(requestId: string, action: 'approve' | 'deny'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/price-requests/${requestId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action }),
    });
    return handleJson(res);
  },

  // Set produce price visibility
  async setProduceVisibility(batchId: number, visibility: 'public' | 'private'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/produce/${batchId}/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visibility }),
    });
    return handleJson(res);
  },

  // Get produce visibility settings for farmer
  async getVisibilitySettings(): Promise<{ settings: VisibilitySetting[] }> {
    const res = await fetch(`${API_BASE}/produce/visibility`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleJson(res);
  },

  // Get user's price request status for a batch
  async getPriceRequestStatus(batchId: number): Promise<PriceRequestStatus> {
    const res = await fetch(`${API_BASE}/price-requests/status/${batchId}`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleJson(res);
  },
};

// Existing API functions with authentication support
const API_KEY = (import.meta as any).env?.VITE_API_KEY as string | undefined;
const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
});

const api = {
  // Add produce (requires session cookie or x-api-key)
  async addProduce(input: { cropName: string; quantity: number; harvestDate: string }) {
    const res = await fetch(`${API_BASE}/produce`, {
      method: 'POST',
      headers: defaultHeaders(),
      credentials: 'include',
      body: JSON.stringify(input),
    });
    return handleJson(res);
  },

  async transferOwnership(input: { batchId: number; recipient: string; price: number }) {
    const res = await fetch(`${API_BASE}/transfer`, {
      method: 'POST',
      headers: defaultHeaders(),
      credentials: 'include',
      body: JSON.stringify(input),
    });
    return handleJson(res);
  },

  async getProduce(batchId: number) {
    const res = await fetch(`${API_BASE}/getProduce/${batchId}`, {
      credentials: 'include',
    });
    return handleJson(res);
  },

  async listBatches() {
    const res = await fetch(`${API_BASE}/batches`, {
      credentials: 'include',
    });
    return handleJson(res);
  },
};

export default api;

export async function health(): Promise<{ ok?: boolean; chainId?: number; contractAddress?: string } & ApiError> {
	const res = await fetch(`${API_BASE}/health`);
	try {
		return await res.json();
	} catch {
		return { error: `Failed to parse /health` } as ApiError;
	}
}

export async function addProduce(input: { cropName: string; quantity: number; harvestDate: string; location?: string }): Promise<{ success: boolean; batchId: number; transactionHash: string; blockNumber: number | null; qrCodeUrl?: string }>{
	const res = await fetch(`${API_BASE}/produce`, {
		method: "POST",
		headers: { 
			"Content-Type": "application/json",
			"x-api-key": "dev-api-key"
		},
		body: JSON.stringify(input),
	});
	return handleJson(res);
}

export async function transferOwnership(input: { batchId: number; recipient: string; price: number }): Promise<{ success: boolean; transactionHash: string; blockNumber: number | null }>{
	const res = await fetch(`${API_BASE}/transfer`, {
		method: "POST",
		headers: { 
			"Content-Type": "application/json",
			"x-api-key": "dev-api-key"
		},
		body: JSON.stringify(input),
	});
	return handleJson(res);
}

export async function getProduce(batchId: number): Promise<{ 
  cropName: string; 
  quantity: number; 
  harvestDate: string; 
  farmer: string; 
  location?: string | null;
  history: Array<{ from: string; to: string; price: number | null; txHash: string; priceHidden?: boolean; blockTimestamp?: number | null }>;
  priceVisibility?: 'public' | 'private';
  pricesHidden?: boolean;
  lastTransferTo?: string | null;
  lastTransferDateISO?: string | null;
} >{
	const res = await fetch(`${API_BASE}/getProduce/${batchId}`, { 
		cache: 'no-store', 
		credentials: 'include', 
		headers: defaultHeaders(),
	});
	return handleJson(res);
}

export async function listBatches(): Promise<{ items: Array<{ batchId: number; cropName: string; quantity: number; harvestDate: string; farmer: string; createdAt: string }> }>{
	const res = await fetch(`${API_BASE}/batches`, { cache: 'no-store', credentials: 'include', headers: defaultHeaders() });
	return handleJson(res);
}
