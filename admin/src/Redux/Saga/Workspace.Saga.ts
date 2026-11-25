import { call, put, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import WebApi from '../../NetworkController/WebApi';
import AdminService from '../Services/Admin.Service';
import { sessionCleared } from '../Reducers/Auth.Reducer';
import {
  bookingsLoaded, customersLoaded, dashboardLoaded, deleteService, failed, loadBookings, loadCustomers,
  loadDashboard, loadNotifications, loadProfessionals, loadServices, mutationFinished, notificationsLoaded,
  professionalsLoaded, saveService, sendNotification, servicesLoaded, updateBooking,
} from '../Reducers/Workspace.Reducer';
import { Booking, Customer, Notice, Professional, Service, Stats } from '../../Assets/Types';

function message(error: unknown) {
  return error instanceof ApiError ? error.message : 'Request failed.';
}

function* guard(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    WebApi.setToken(null);
    yield put(sessionCleared());
    return;
  }
  yield put(failed(message(error)));
}

function* onDashboard() {
  try {
    const result: { stats: Stats; recentBookings: Booking[] } = yield call(AdminService.dashboard);
    yield put(dashboardLoaded({ stats: result.stats, recent: result.recentBookings }));
  } catch (error) { yield* guard(error); }
}

function* onServices() {
  try {
    const result: { services: Service[] } = yield call(AdminService.services);
    yield put(servicesLoaded(result.services));
  } catch (error) { yield* guard(error); }
}

function* onSave(action: ReturnType<typeof saveService>) {
  try {
    const { id, ...body } = action.payload;
    if (id) yield call(AdminService.updateService, id, body);
    else yield call(AdminService.createService, body);
    yield put(mutationFinished(id ? 'Service updated.' : 'Service added.'));
    yield put(loadServices());
  } catch (error) { yield* guard(error); }
}

function* onDelete(action: ReturnType<typeof deleteService>) {
  try {
    const result: { removed: string } = yield call(AdminService.deleteService, action.payload);
    yield put(mutationFinished(result.removed === 'deleted' ? 'Service deleted.' : 'Service hidden from customers. Past bookings still reference it.'));
    yield put(loadServices());
  } catch (error) { yield* guard(error); }
}

function* onBookings(action: ReturnType<typeof loadBookings>) {
  try {
    const result: { bookings: Booking[] } = yield call(AdminService.bookings, action.payload || '');
    yield put(bookingsLoaded(result.bookings));
  } catch (error) { yield* guard(error); }
}

function* onUpdate(action: ReturnType<typeof updateBooking>) {
  try {
    yield call(AdminService.updateBooking, action.payload.id, {
      status: action.payload.status,
      professionalId: action.payload.professionalId,
    });
    yield put(mutationFinished('Booking updated. The customer will see a notification.'));
    yield put(loadBookings(undefined));
  } catch (error) { yield* guard(error); }
}

function* onCustomers() {
  try {
    const result: { customers: Customer[] } = yield call(AdminService.customers);
    yield put(customersLoaded(result.customers));
  } catch (error) { yield* guard(error); }
}

function* onProfessionals() {
  try {
    const result: { professionals: Professional[] } = yield call(AdminService.professionals);
    yield put(professionalsLoaded(result.professionals));
  } catch (error) { yield* guard(error); }
}

function* onNotifications() {
  try {
    const result: { notifications: Notice[] } = yield call(AdminService.notifications);
    yield put(notificationsLoaded(result.notifications));
  } catch (error) { yield* guard(error); }
}

function* onSend(action: ReturnType<typeof sendNotification>) {
  try {
    yield call(AdminService.sendNotification, action.payload);
    yield put(mutationFinished('Notification sent.'));
    yield put(loadNotifications());
  } catch (error) { yield* guard(error); }
}

export function* workspaceSaga() {
  yield takeLatest(loadDashboard.type, onDashboard);
  yield takeLatest(loadServices.type, onServices);
  yield takeLatest(saveService.type, onSave);
  yield takeLatest(deleteService.type, onDelete);
  yield takeLatest(loadBookings.type, onBookings);
  yield takeLatest(updateBooking.type, onUpdate);
  yield takeLatest(loadCustomers.type, onCustomers);
  yield takeLatest(loadProfessionals.type, onProfessionals);
  yield takeLatest(loadNotifications.type, onNotifications);
  yield takeLatest(sendNotification.type, onSend);
}
