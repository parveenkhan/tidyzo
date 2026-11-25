import { all } from 'redux-saga/effects';
import { authSaga } from './Auth.Saga';
import { serviceSaga } from './Service.Saga';
import { bookingSaga } from './Booking.Saga';
import { notificationSaga } from './Notification.Saga';

export default function* rootSaga() {
  yield all([authSaga(), serviceSaga(), bookingSaga(), notificationSaga()]);
}
