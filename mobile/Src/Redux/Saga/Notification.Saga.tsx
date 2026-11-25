import { call, put, select, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import WebApi from '../../NetworkController/WebApi';
import NotificationService from '../Services/Notification.Service';
import BookingService from '../Services/Booking.Service';
import ProviderService from '../Services/Provider.Service';
import { bookingsLoaded, resetBookings } from '../Reducers/Booking.Reducer';
import { sessionCleared } from '../Reducers/Auth.Reducer';
import {
  markAllRead,
  markRead,
  notificationsLoaded,
  refreshInbox,
  resetNotifications,
  showNotice,
} from '../Reducers/Notification.Reducer';
import { clearToken } from '../../Utils/SecureToken';
import { AppNotification, Booking } from '../../Assets/Types';

type InboxState = {
  notifications: {
    items: AppNotification[];
    booted: boolean;
  };
};

function* refreshProviderInbox() {
  try {
    const previous: AppNotification[] = yield select((state: InboxState) => state.notifications.items);
    const booted: boolean = yield select((state: InboxState) => state.notifications.booted);
    const notes: { notifications: AppNotification[]; unread: number } = yield call(ProviderService.notifications);
    const jobs: { bookings: Booking[] } = yield call(ProviderService.jobs);
    yield put(bookingsLoaded(jobs.bookings));
    yield put(notificationsLoaded(notes));
    if (!booted) return;
    const known = new Set(previous.map((item) => item.id));
    const fresh = notes.notifications.find((item) => !known.has(item.id));
    if (fresh) {
      yield put(showNotice({ id: fresh.id, title: fresh.title, body: fresh.body, bookingId: fresh.bookingId }));
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      yield call(clearToken);
      WebApi.setToken(null);
      yield put(resetBookings());
      yield put(resetNotifications());
      yield put(sessionCleared());
    }
  }
}

function* onRefresh() {
  const role: string | null = yield select((state: { auth: { role: string | null } }) => state.auth.role);
  if (role === 'provider') {
    yield call(refreshProviderInbox);
    return;
  }
  try {
    const previous: AppNotification[] = yield select((state: InboxState) => state.notifications.items);
    const booted: boolean = yield select((state: InboxState) => state.notifications.booted);
    const notes: { notifications: AppNotification[]; unread: number } = yield call(NotificationService.list);
    const bookings: { bookings: Booking[] } = yield call(BookingService.list);
    yield put(bookingsLoaded(bookings.bookings));
    yield put(notificationsLoaded(notes));
    if (!booted) return;
    const known = new Set(previous.map((item) => item.id));
    const fresh = notes.notifications.find((item) => !known.has(item.id));
    if (fresh) {
      yield put(showNotice({ id: fresh.id, title: fresh.title, body: fresh.body, bookingId: fresh.bookingId }));
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      yield call(clearToken);
      WebApi.setToken(null);
      yield put(resetBookings());
      yield put(resetNotifications());
      yield put(sessionCleared());
    }
  }
}

function* onMarkRead(action: ReturnType<typeof markRead>) {
  try {
    yield call(NotificationService.markRead, action.payload);
  } catch {
    yield put(refreshInbox());
  }
}

function* onMarkAll() {
  try {
    yield call(NotificationService.markAll);
  } catch {
    yield put(refreshInbox());
  }
}

export function* notificationSaga() {
  yield takeLatest(refreshInbox.type, onRefresh);
  yield takeLatest(markRead.type, onMarkRead);
  yield takeLatest(markAllRead.type, onMarkAll);
}
