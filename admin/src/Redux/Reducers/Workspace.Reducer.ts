import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, Customer, Notice, Professional, Service, ServiceInput, Stats } from '../../Assets/Types';

interface WorkspaceState {
  stats: Stats;
  recent: Booking[];
  services: Service[];
  bookings: Booking[];
  customers: Customer[];
  professionals: Professional[];
  notifications: Notice[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
}

const initialState: WorkspaceState = {
  stats: { customers: 0, bookings: 0, pending: 0, today: 0 },
  recent: [],
  services: [],
  bookings: [],
  customers: [],
  professionals: [],
  notifications: [],
  loading: false,
  saving: false,
  error: null,
  notice: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    loadDashboard(state) { state.loading = true; state.error = null; },
    dashboardLoaded(state, action: PayloadAction<{ stats: Stats; recent: Booking[] }>) {
      state.loading = false;
      state.stats = action.payload.stats;
      state.recent = action.payload.recent;
    },
    loadServices(state) { state.loading = true; state.error = null; },
    servicesLoaded(state, action: PayloadAction<Service[]>) { state.loading = false; state.services = action.payload; },
    saveService(state, _action: PayloadAction<ServiceInput & { id?: string }>) { state.saving = true; state.error = null; state.notice = null; },
    deleteService(state, _action: PayloadAction<string>) { state.saving = true; state.error = null; },
    loadBookings(state, _action: PayloadAction<string | undefined>) { state.loading = true; state.error = null; },
    bookingsLoaded(state, action: PayloadAction<Booking[]>) { state.loading = false; state.bookings = action.payload; },
    updateBooking(state, _action: PayloadAction<{ id: string; status: string; professionalId?: string | null }>) { state.saving = true; state.error = null; state.notice = null; },
    loadCustomers(state) { state.loading = true; state.error = null; },
    customersLoaded(state, action: PayloadAction<Customer[]>) { state.loading = false; state.customers = action.payload; },
    loadProfessionals(state) { state.error = null; },
    professionalsLoaded(state, action: PayloadAction<Professional[]>) { state.professionals = action.payload; },
    loadNotifications(state) { state.loading = true; state.error = null; },
    notificationsLoaded(state, action: PayloadAction<Notice[]>) { state.loading = false; state.notifications = action.payload; },
    sendNotification(state, _action: PayloadAction<{ customerId: string; title: string; body: string; bookingId?: string }>) {
      state.saving = true;
      state.error = null;
      state.notice = null;
    },
    mutationFinished(state, action: PayloadAction<string>) {
      state.saving = false;
      state.notice = action.payload;
    },
    failed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.saving = false;
      state.error = action.payload;
    },
    clearNotice(state) { state.notice = null; },
  },
});

export const {
  loadDashboard, dashboardLoaded, loadServices, servicesLoaded, saveService, deleteService,
  loadBookings, bookingsLoaded, updateBooking, loadCustomers, customersLoaded,
  loadProfessionals, professionalsLoaded, loadNotifications, notificationsLoaded,
  sendNotification, mutationFinished, failed, clearNotice,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
