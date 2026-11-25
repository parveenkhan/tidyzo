import WebApi from '../../NetworkController/WebApi';
import { Booking, BookingDraft } from '../../Assets/Types';

class BookingService {
  static list() {
    return WebApi.get<{ ok: boolean; bookings: Booking[] }>('/api/v1/bookings');
  }

  static create(draft: BookingDraft) {
    return WebApi.post<{ ok: boolean; booking: Booking }>('/api/v1/bookings', draft);
  }
}

export default BookingService;
