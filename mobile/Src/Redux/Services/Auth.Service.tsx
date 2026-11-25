import WebApi from '../../NetworkController/WebApi';
import { AccountKind, Customer, Provider } from '../../Assets/Types';

interface OtpRequest {
  ok: boolean;
  expiresInSec: number;
  debugOtp?: string;
}

interface Session {
  ok: boolean;
  role: 'customer' | 'provider';
  token: string;
  customer?: Customer;
  provider?: Provider;
}

interface Me {
  ok: boolean;
  customer: Customer;
}

class AuthService {
  static requestOtp(mobile: string) {
    return WebApi.post<OtpRequest>('/api/v1/auth/otp/request', { mobile });
  }

  static verify(body: { mobile: string; otp: string; name?: string; skill?: string; account: AccountKind; intent: 'signin' | 'signup' }) {
    return WebApi.post<Session>('/api/v1/auth/otp/verify', body);
  }

  static me() {
    return WebApi.get<Me>('/api/v1/auth/me');
  }

  static providerMe() {
    return WebApi.get<{ ok: boolean; provider: Provider }>('/api/v1/provider/me');
  }

  static logout() {
    return WebApi.post<{ ok: boolean }>('/api/v1/auth/logout');
  }

  static providerLogout() {
    return WebApi.post<{ ok: boolean }>('/api/v1/provider/logout');
  }

  static updateProfile(body: Partial<Pick<Customer, 'name' | 'addressLine' | 'city' | 'pincode'>> & { fcmToken?: string | null }) {
    return WebApi.patch<Me>('/api/v1/auth/me', body);
  }
}

export default AuthService;
