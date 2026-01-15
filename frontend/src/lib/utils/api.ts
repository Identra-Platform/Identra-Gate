import type { ActivityLog, CreateAuthorizationRequestDto, CreateCredentialOfferDto, CreateTemplateDto, CreateUserDto, CredentialOfferResponse, DatabaseHealthResponse, HealthResponse, LightHealthResponse, LoginRequest, LoginResponse, LogoutResponse, MetricsResponse, PaginatedUsersResponse, ProfileResponse, Statistics, Template, UpdateUserDto, UsersQueryParams, VerificationRequest } from "$lib/types/api";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

const API_BASE = 'http://localhost:3000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  } as Record<string, string>,
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== 'undefined') {
      try {
        const storedAuth = localStorage.getItem('auth');

        if (storedAuth) {
          const auth = JSON.parse(storedAuth);
          if (auth.accessToken) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${auth.accessToken}`;
          }
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error)
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth');
      }
      // window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 
      error.message || 
      'Request failed';
    
    return Promise.reject(new Error(message));
  }
);

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const storedAuth = localStorage.getItem('auth');
    if (storedAuth) {
      const auth = JSON.parse(storedAuth);
      return auth.accessToken;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  
  return null;
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token;
}
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const storedAuth = localStorage.getItem('auth');
    const auth = storedAuth ? JSON.parse(storedAuth) : {};
    auth.accessToken = token;
    localStorage.setItem('auth', JSON.stringify(auth));
    
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.error('Failed to set auth token:', error);
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth');
  delete api.defaults.headers.common.Authorization;
}



// ======= Audit ========
export async function getRecentActivites(limit = 3): Promise<ActivityLog[]> {
  const response = await api.get<ActivityLog[]>('/audit/logs/recent', {
    params: {
      limit
    }
  });
  return response.data;
}

export async function getStatistics(): Promise<Statistics> {
  const response = await api.get<Statistics>('/audit/statistics');
  return response.data;
}



// ====== Health =======
export async function getHealth(detailed = true): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health', {
    params: {
      detailed
    }
  });
  return response.data;
}

export async function getLightHealth(): Promise<LightHealthResponse> {
  const response = await api.get<LightHealthResponse>('/health/light');
  return response.data;
}

export async function getDatabaseHealth(): Promise<DatabaseHealthResponse> {
  const response = await api.get<DatabaseHealthResponse>('/health/database');
  return response.data;
}

export async function getMetrics(): Promise<MetricsResponse> {
  const response = await api.get<MetricsResponse>('/health/metrics');
  return response.data;
}



// ====== Auth =======

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  
  // Automatically store token on successful login
  if (response.data.access_token) {
    setAuthToken(response.data.access_token);
  }
  
  return response.data;
}

export async function logout(): Promise<LogoutResponse> {
  const response = await api.post<LogoutResponse>('/auth/logout');
  console.log(response);
  
  // Clear auth on logout
  clearAuth();
  
  return response.data;
}

export async function getProfile(): Promise<ProfileResponse> {
  const response = await api.get<ProfileResponse>('/auth/profile');
  return response.data;
}


// ===== User ======

export async function createUser(data: CreateUserDto): Promise<any> {
  const response = await api.post('/users', data);
  return response.data;
}

export async function getUsers(params?: UsersQueryParams): Promise<PaginatedUsersResponse> {
  const response = await api.get<PaginatedUsersResponse>('/users', {
    params,
  });
  return response.data;
}

export async function getUserById(id: string): Promise<any> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<any> {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}


// ===== Credentials =======

export async function createCredentialOffer(data: CreateCredentialOfferDto): Promise<CredentialOfferResponse> {
  const response = await api.post<CredentialOfferResponse>('/credentials', data);
  return response.data;
}

export async function getCredentialById(id: string) {
  const response = await api.get<CredentialOfferResponse>(`/credentials/${id}`);
  return response.data;
}

export async function getAllCredentials() {
  const response = await api.get<CredentialOfferResponse[]>('/credentials');
  return response.data;
}

export async function createTemplate(data: CreateTemplateDto) {
  const response = await api.post('/templates', data);
  return response.data;
}

export async function getTemplates() {
  const response = await api.get<Template[]>('/templates');
  return response.data;
}

export async function getTemplateById(id: string) {
  const response = await api.get<Template>(`/templates/${id}`);
  return response.data;
}


// ========= Verification ==========

export async function createVerificationRequest(data: CreateAuthorizationRequestDto): Promise<any> {
  const response = await api.post('/verification', data);
  return response.data;
}

export async function getVerificationRequest(id: string): Promise<VerificationRequest> {
  const response = await api.get<VerificationRequest>(`/verification/${id}`);
  return response.data;
}



// ====== Utils ========

export function createCancelTokenSource() {
  return axios.CancelToken.source();
}

export function isCancel(error: any): boolean {
  return axios.isCancel(error);
}

export async function customRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}



export { api };