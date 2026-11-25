import WebApi from '../../NetworkController/WebApi';
import { AppNotification, Booking, Provider } from '../../Assets/Types';

class ProviderService {
  static jobs() {
    return WebApi.get<{ ok: boolean; bookings: Booking[] }>('/api/v1/provider/bookings');
  }

  static updateJob(id: string, status: 'accepted' | 'rejected' | 'in_progress' | 'completed') {
    return WebApi.patch<{ ok: boolean; booking: Booking }>(`/api/v1/provider/bookings/${id}`, { status });
  }

  static notifications() {
    return WebApi.get<{ ok: boolean; notifications: AppNotification[]; unread: number }>('/api/v1/provider/notifications');
  }

  static updateArea(body: { city: string; rangeKm: number; latitude: number; longitude: number }) {
    return WebApi.patch<{ ok: boolean; provider: Provider }>('/api/v1/provider/me', body);
  }
}

export default ProviderService;
