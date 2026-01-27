import { cookies } from "next/headers";
import 'server-only';

export interface HttpBaseResponse<T = any> {
  code?: number;
  data?: T;
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

  async request<T = any>(endpoint: string, options: RequestInit = {}, params?: Record<string, string>): Promise<T> {
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
      body: options.body ? JSON.stringify(options.body) : null,
    };

    try {
      const response = await fetch(url, requestOptons);
      return await response.json();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async post<T>(endpoint: string, data?: any, params?: Record<string, string>): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, params);
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, {
      method: 'GET',
    }, params);
  }

  async put<T>(endpoint: string, data?: any): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<HttpBaseResponse<T>> {
    return this.request<HttpBaseResponse<T>>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const httpClient = new Http();