import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Service } from '../../Assets/Types';

interface ServiceState {
  items: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServiceState = { items: [], loading: false, error: null };

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    fetchServices(state) {
      state.loading = state.items.length === 0;
      state.error = null;
    },
    fetchServicesSuccess(state, action: PayloadAction<Service[]>) {
      state.loading = false;
      state.items = action.payload;
    },
    fetchServicesFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchServices, fetchServicesSuccess, fetchServicesFailure } = serviceSlice.actions;
export default serviceSlice.reducer;
