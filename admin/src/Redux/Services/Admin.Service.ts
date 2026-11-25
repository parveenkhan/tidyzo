import WebApi from '../../NetworkController/WebApi';
import { Booking, Customer, Notice, Professional, Service, ServiceInput, Stats } from '../../Assets/Types';

class AdminService {
  static dashboard() {
    return WebApi.get<{ stats: Stats; recentBookings: Booking[] }>('/api/v1/admin/dashboard');
  }

  static services() {
    return WebApi.get<{ services: Service[] }>('/api/v1/admin/services');
  }

  static createService(body: ServiceInput) {
    return WebApi.post<{ service: Service }>('/api/v1/admin/services', body);
  }

  static updateService(id: string, body: ServiceInput) {
    return WebApi.patch<{ service: Service }>(`/api/v1/admin/services/${id}`, body);
  }

  static deleteService(id: string) {
    return WebApi.delete<{ removed: string }>(`/api/v1/admin/services/${id}`);
  }

  static bookings(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return WebApi.get<{ bookings: Booking[] }>(`/api/v1/admin/bookings${query}`);
  }

  static updateBooking(id: string, body: { status: string; professionalId?: string | null }) {
    return WebApi.patch<{ booking: Booking }>(`/api/v1/admin/bookings/${id}`, body);
  }

  static customers() {
    return WebApi.get<{ customers: Customer[] }>('/api/v1/admin/customers');
  }

  static professionals() {
    return WebApi.get<{ professionals: Professional[] }>('/api/v1/admin/professionals');
  }

  static notifications() {
    return WebApi.get<{ notifications: Notice[] }>('/api/v1/admin/notifications');
  }

  static sendNotification(body: { customerId: string; title: string; body: string; bookingId?: string }) {
    return WebApi.post<{ notification: Notice }>('/api/v1/admin/notifications', body);
  }
}

export default AdminService;
