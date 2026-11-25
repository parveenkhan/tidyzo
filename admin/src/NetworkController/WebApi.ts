import WebConstant from './WebConstant';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class WebApi {
  static token: string | null = null;

  static setToken(token: string | null) {
    WebApi.token = token;
  }

  static async request<T>(path: string, method = WebConstant.GET, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WebConstant.timeout);
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (WebApi.token) headers.Authorization = `Bearer ${WebApi.token}`;
      const response = await fetch(`${WebConstant.BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok || data?.ok === false) throw new ApiError(data?.error || 'Request failed.', response.status);
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Cannot reach the TidyZo API. Start the backend, then refresh.', 0);
    } finally {
      clearTimeout(timer);
    }
  }

  static get<T>(path: string) { return WebApi.request<T>(path); }
  static post<T>(path: string, body?: unknown) { return WebApi.request<T>(path, WebConstant.POST, body); }
  static patch<T>(path: string, body?: unknown) { return WebApi.request<T>(path, WebConstant.PATCH, body); }
  static delete<T>(path: string) { return WebApi.request<T>(path, WebConstant.DELETE); }
}

export default WebApi;
