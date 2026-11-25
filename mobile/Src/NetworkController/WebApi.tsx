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

  static async request<T>(path: string, method: string = WebConstant.GET, body?: unknown): Promise<T> {
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
      let data: { ok?: boolean; error?: string } | null = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new ApiError('The server returned an unexpected response.', response.status);
        }
      }
      if (!response.ok || data?.ok === false) {
        throw new ApiError(data?.error || 'Request failed.', response.status);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('The request timed out.', 0);
      }
      throw new ApiError(
        `Cannot reach the TidyZo API at ${WebConstant.BASE_URL}. Start it with npm run backend, then try again.`,
        0,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  static get<T>(path: string) {
    return WebApi.request<T>(path, WebConstant.GET);
  }

  static post<T>(path: string, body?: unknown) {
    return WebApi.request<T>(path, WebConstant.POST, body);
  }

  static patch<T>(path: string, body?: unknown) {
    return WebApi.request<T>(path, WebConstant.PATCH, body);
  }
}

export default WebApi;
