import { call, put, select, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import WebApi from '../../NetworkController/WebApi';
import { clearToken, readToken, roleFromToken, saveToken } from '../../Utils/SecureToken';
import AuthService from '../Services/Auth.Service';
import ProviderService from '../Services/Provider.Service';
import {
  bootstrap,
  logout,
  markReady,
  profileFailed,
  profileUpdated,
  providerAreaUpdated,
  requestOtp,
  requestOtpFailure,
  requestOtpSuccess,
  sessionCleared,
  sessionRestored,
  updateProfile,
  updateProviderArea,
  verifyOtp,
  verifyOtpFailure,
  verifyOtpSuccess,
} from '../Reducers/Auth.Reducer';
import { resetBookings } from '../Reducers/Booking.Reducer';
import { resetNotifications } from '../Reducers/Notification.Reducer';
import { Customer, Provider, SessionRole } from '../../Assets/Types';

function message(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Try again.';
}

function* onBootstrap() {
  try {
    const token: string | null = yield call(readToken);
    if (!token) return;
    WebApi.setToken(token);
    const role = roleFromToken(token);
    if (role === 'provider') {
      const me: { provider: Provider } = yield call(AuthService.providerMe);
      yield put(sessionRestored({ token, role: 'provider', provider: me.provider }));
      return;
    }
    const me: { customer: Customer } = yield call(AuthService.me);
    yield put(sessionRestored({ token, role: 'customer', customer: me.customer }));
  } catch {
    yield call(clearToken);
    WebApi.setToken(null);
    yield put(sessionCleared());
  } finally {
    yield put(markReady());
  }
}

function* onRequestOtp(action: ReturnType<typeof requestOtp>) {
  try {
    const mobile = action.payload.mobile;
    const result: { debugOtp?: string } = yield call(AuthService.requestOtp, mobile);
    yield put(requestOtpSuccess({ mobile, debugOtp: result.debugOtp ?? null }));
  } catch (error) {
    yield put(requestOtpFailure(message(error)));
  }
}

function* onVerify(action: ReturnType<typeof verifyOtp>) {
  try {
    const result: { token: string; role: SessionRole; customer?: Customer; provider?: Provider } = yield call(AuthService.verify, action.payload);
    yield call(saveToken, result.token);
    WebApi.setToken(result.token);
    yield put(verifyOtpSuccess({
      token: result.token,
      role: result.role,
      customer: result.customer ?? null,
      provider: result.provider ?? null,
    }));
  } catch (error) {
    yield put(verifyOtpFailure(message(error)));
  }
}

function* onUpdateProfile(action: ReturnType<typeof updateProfile>) {
  try {
    const result: { customer: Customer } = yield call(AuthService.updateProfile, action.payload);
    yield put(profileUpdated(result.customer));
  } catch (error) {
    yield put(profileFailed(message(error)));
  }
}

function* onUpdateArea(action: ReturnType<typeof updateProviderArea>) {
  try {
    const result: { provider: Provider } = yield call(ProviderService.updateArea, action.payload);
    yield put(providerAreaUpdated(result.provider));
  } catch (error) {
    yield put(profileFailed(message(error)));
  }
}
function* onLogout() {
  const role: SessionRole | null = yield select((state: { auth: { role: SessionRole | null } }) => state.auth.role);
  try {
    if (role === 'provider') yield call(AuthService.providerLogout);
    else yield call(AuthService.logout);
  } catch {
    // Local sign-out still proceeds when the network call fails.
  }
  yield call(clearToken);
  WebApi.setToken(null);
  yield put(resetBookings());
  yield put(resetNotifications());
  yield put(sessionCleared());
}

export function* authSaga() {
  yield takeLatest(bootstrap.type, onBootstrap);
  yield takeLatest(requestOtp.type, onRequestOtp);
  yield takeLatest(verifyOtp.type, onVerify);
  yield takeLatest(updateProfile.type, onUpdateProfile);
  yield takeLatest(updateProviderArea.type, onUpdateArea);
  yield takeLatest(logout.type, onLogout);
}
