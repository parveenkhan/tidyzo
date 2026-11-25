import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminUser } from '../../Assets/Types';

interface AuthState {
  token: string | null;
  admin: AdminUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { token: null, admin: null, loading: false, error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, _action: PayloadAction<{ email: string; password: string }>) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; admin: AdminUser }>) {
      state.loading = false;
      state.token = action.payload.token;
      state.admin = action.payload.admin;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout() {},
    sessionCleared() {
      return initialState;
    },
  },
});

export const { login, loginSuccess, loginFailure, logout, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
