import WebApi from '../../NetworkController/WebApi';
import { AppNotification } from '../../Assets/Types';

class NotificationService {
  static list() {
    return WebApi.get<{ ok: boolean; notifications: AppNotification[]; unread: number }>('/api/v1/notifications');
  }

  static markRead(id: string) {
    return WebApi.post<{ ok: boolean }>(`/api/v1/notifications/${id}/read`);
  }

  static markAll() {
    return WebApi.post<{ ok: boolean }>('/api/v1/notifications/read-all');
  }
}

export default NotificationService;
