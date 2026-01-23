import { cookies } from "next/headers";

interface HttpBaseResponse {
  code?: number;
  data?: any;
  [key: string]: any
}

export class Http {
  private getBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is not defined');
    }

    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  async request<T = HttpBaseResponse>(endpoint: string, options: RequestInit = {}, params?: Record<string, string>): Promise<T> {
    let fullEndpoint = endpoint;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      fullEndpoint = `${endpoint}?${queryString}`;
    }

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${fullEndpoint}`;

    const cookieStore = await cookies();
    const authToken = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value || '';

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (authToken) {
      headers.append('Authorization', `Bearer ${authToken}`);
    }


    const requestOptons: RequestInit = {
      ...options,
      method: options.method,
      headers,
      cache: 'no-store',
      body: options.body ? JSON.stringify(options.body) : null,
    };

    try {
      const response = await fetch(url, requestOptons);
      return await response.json();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async post<T = HttpBaseResponse>(endpoint: string, data?: any, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  async get<T = HttpBaseResponse>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    }, params);
  }

  async put<T = HttpBaseResponse>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = HttpBaseResponse>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const httpClient = new Http();