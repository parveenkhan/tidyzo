import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingDraft } from '../../Assets/Types';

interface BookingState {
  items: Booking[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  justBookedId: string | null;
}

const initialState: BookingState = { items: [], loading: false, saving: false, error: null, justBookedId: null };

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    fetchBookings(state) {
      state.loading = state.items.length === 0;
      state.error = null;
    },
    bookingsLoaded(state, action: PayloadAction<Booking[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchBookingsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    createBooking(state, _action: PayloadAction<BookingDraft>) {
      state.saving = true;
      state.error = null;
      state.justBookedId = null;
    },
    createBookingSuccess(state, action: PayloadAction<Booking>) {
      state.saving = false;
      state.justBookedId = action.payload.id;
      state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)];
    },
    createBookingFailure(state, action: PayloadAction<string>) {
      state.saving = false;
      state.error = action.payload;
    },
    fetchProviderJobs(state) {
      state.loading = state.items.length === 0;
      state.error = null;
    },
    updateProviderJob(state, _action: PayloadAction<{ id: string; status: 'accepted' | 'rejected' | 'in_progress' | 'completed' }>) {
      state.saving = true;
      state.error = null;
    },
    providerJobUpdated(state, action: PayloadAction<Booking>) {
      state.saving = false;
      const next = action.payload;
      state.items = next.professionalId
        ? state.items.map((item) => (item.id === next.id ? next : item))
        : state.items.filter((item) => item.id !== next.id);
    },
    clearBookingError(state) {
      state.error = null;
      state.justBookedId = null;
    },
    resetBookings() {
      return initialState;
    },
  },
});

export const {
  fetchBookings,
  bookingsLoaded,
  fetchBookingsFailure,
  createBooking,
  createBookingSuccess,
  createBookingFailure,
  fetchProviderJobs,
  updateProviderJob,
  providerJobUpdated,
  clearBookingError,
  resetBookings,
} = bookingSlice.actions;

export default bookingSlice.reducer;
