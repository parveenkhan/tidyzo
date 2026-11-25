import { call, put, takeLatest } from 'redux-saga/effects';
import { ApiError } from '../../NetworkController/WebApi';
import ServiceApi from '../Services/Service.Service';
import { fetchServices, fetchServicesFailure, fetchServicesSuccess } from '../Reducers/Service.Reducer';
import { Service } from '../../Assets/Types';

function* onFetch() {
  try {
    const result: { services: Service[] } = yield call(ServiceApi.list);
    yield put(fetchServicesSuccess(result.services));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Could not load services.';
    yield put(fetchServicesFailure(message));
  }
}

export function* serviceSaga() {
  yield takeLatest(fetchServices.type, onFetch);
}
