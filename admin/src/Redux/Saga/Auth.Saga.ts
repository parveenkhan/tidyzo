import { call, put, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import WebApi from '../../NetworkController/WebApi';
import AuthService from '../Services/Auth.Service';
import { login, loginFailure, loginSuccess, logout, sessionCleared } from '../Reducers/Auth.Reducer';
import { AdminUser } from '../../Assets/Types';

function* onLogin(action: ReturnType<typeof login>) {
  try {
    const result: { token: string; admin: AdminUser } = yield call(AuthService.login, action.payload.email, action.payload.password);
    WebApi.setToken(result.token);
    yield put(loginSuccess(result));
  } catch (error) {
    yield put(loginFailure(error instanceof ApiError ? error.message : 'Could not sign in.'));
  }
}

function* onLogout() {
  try { yield call(AuthService.logout); } catch { /* drop the local session anyway */ }
  WebApi.setToken(null);
  yield put(sessionCleared());
}

export function* authSaga() {
  yield takeLatest(login.type, onLogin);
  yield takeLatest(logout.type, onLogout);
}
