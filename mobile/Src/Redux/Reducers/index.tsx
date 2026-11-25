import { combineReducers } from '@reduxjs/toolkit';
import auth from './Auth.Reducer';
import services from './Service.Reducer';
import bookings from './Booking.Reducer';
import notifications from './Notification.Reducer';

const rootReducer = combineReducers({
  auth,
  services,
  bookings,
  notifications,
});

export default rootReducer;
