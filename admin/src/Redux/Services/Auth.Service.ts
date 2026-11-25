import WebApi from '../../NetworkController/WebApi';
import { AdminUser } from '../../Assets/Types';

class AuthService {
  static login(email: string, password: string) {
    return WebApi.post<{ token: string; admin: AdminUser }>('/api/v1/admin/auth/login', { email, password });
  }

  static logout() {
    return WebApi.post<{ ok: boolean }>('/api/v1/admin/auth/logout');
  }
}

export default AuthService;
