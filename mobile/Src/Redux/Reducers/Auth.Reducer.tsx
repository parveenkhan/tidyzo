import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountKind, Customer, Provider, SessionRole } from '../../Assets/Types';

interface AuthState {
  ready: boolean;
  token: string | null;
  role: SessionRole | null;
  customer: Customer | null;
  provider: Provider | null;
  loading: boolean;
  error: string | null;
  challengeMobile: string | null;
  debugOtp: string | null;
  otpRequestId: number;
}

const initialState: AuthState = {
  ready: false,
  token: null,
  role: null,
  customer: null,
  provider: null,
  loading: false,
  error: null,
  challengeMobile: null,
  debugOtp: null,
  otpRequestId: 0,
};

interface SessionPayload {
  token: string;
  role: SessionRole;
  customer?: Customer | null;
  provider?: Provider | null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    bootstrap() {},
    markReady(state) {
      state.ready = true;
    },
    sessionRestored(state, action: PayloadAction<SessionPayload>) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.customer = action.payload.customer ?? null;
      state.provider = action.payload.provider ?? null;
      state.error = null;
    },
    sessionCleared(state) {
      state.token = null;
      state.role = null;
      state.customer = null;
      state.provider = null;
      state.challengeMobile = null;
      state.debugOtp = null;
      state.loading = false;
    },
    clearError(state) {
      state.error = null;
    },
    requestOtp(state, _action: PayloadAction<{ mobile: string }>) {
      state.loading = true;
      state.error = null;
    },
    requestOtpSuccess(state, action: PayloadAction<{ mobile: string; debugOtp: string | null }>) {
      state.loading = false;
      state.challengeMobile = action.payload.mobile;
      state.debugOtp = action.payload.debugOtp;
      state.otpRequestId += 1;
    },
    requestOtpFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    verifyOtp(state, _action: PayloadAction<{ mobile: string; otp: string; name?: string; skill?: string; account: AccountKind; intent: 'signin' | 'signup' }>) {
      state.loading = true;
      state.error = null;
    },
    verifyOtpSuccess(state, action: PayloadAction<SessionPayload>) {
      state.loading = false;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.customer = action.payload.customer ?? null;
      state.provider = action.payload.provider ?? null;
      state.challengeMobile = null;
      state.debugOtp = null;
      state.ready = true;
    },
    verifyOtpFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfile(
      state,
      _action: PayloadAction<Partial<Pick<Customer, 'name' | 'addressLine' | 'city' | 'pincode'>> & { fcmToken?: string | null }>,
    ) {
      state.loading = true;
      state.error = null;
    },
    profileUpdated(state, action: PayloadAction<Customer>) {
      state.loading = false;
      state.customer = action.payload;
    },
    profileFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateProviderArea(state, _action: PayloadAction<{ city: string; rangeKm: number; latitude: number; longitude: number }>) {
      state.loading = true;
      state.error = null;
    },
    providerAreaUpdated(state, action: PayloadAction<Provider>) {
      state.loading = false;
      state.provider = action.payload;
    },
    logout() {},
  },
});

export const {
  bootstrap,
  markReady,
  sessionRestored,
  sessionCleared,
  clearError,
  requestOtp,
  requestOtpSuccess,
  requestOtpFailure,
  verifyOtp,
  verifyOtpSuccess,
  verifyOtpFailure,
  updateProfile,
  profileUpdated,
  profileFailed,
  updateProviderArea,
  providerAreaUpdated,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
