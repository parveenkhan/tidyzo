import { call, put, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import BookingService from '../Services/Booking.Service';
import {
  bookingsLoaded,
  createBooking,
  createBookingFailure,
  createBookingSuccess,
  fetchBookings,
  fetchBookingsFailure,
  fetchProviderJobs,
  providerJobUpdated,
  updateProviderJob,
} from '../Reducers/Booking.Reducer';
import { Booking } from '../../Assets/Types';
import ProviderService from '../Services/Provider.Service';

function* onFetch() {
  try {
    const result: { bookings: Booking[] } = yield call(BookingService.list);
    yield put(bookingsLoaded(result.bookings));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Could not load bookings.';
    yield put(fetchBookingsFailure(message));
  }
}

function* onCreate(action: ReturnType<typeof createBooking>) {
  try {
    const result: { booking: Booking } = yield call(BookingService.create, action.payload);
    yield put(createBookingSuccess(result.booking));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Could not save the booking.';
    yield put(createBookingFailure(message));
  }
}

function* onProviderJobs() {
  try {
    const result: { bookings: Booking[] } = yield call(ProviderService.jobs);
    yield put(bookingsLoaded(result.bookings));
  } catch (error) {
    const text = error instanceof ApiError ? error.message : 'Could not load jobs.';
    yield put(fetchBookingsFailure(text));
  }
}

function* onProviderUpdate(action: ReturnType<typeof updateProviderJob>) {
  try {
    const result: { booking: Booking } = yield call(ProviderService.updateJob, action.payload.id, action.payload.status);
    yield put(providerJobUpdated(result.booking));
  } catch (error) {
    const text = error instanceof ApiError ? error.message : 'Could not update the job.';
    yield put(createBookingFailure(text));
  }
}

export function* bookingSaga() {
  yield takeLatest(fetchBookings.type, onFetch);
  yield takeLatest(createBooking.type, onCreate);
  yield takeLatest(fetchProviderJobs.type, onProviderJobs);
  yield takeLatest(updateProviderJob.type, onProviderUpdate);
}
