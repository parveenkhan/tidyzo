import { all } from 'redux-saga/effects';
import { authSaga } from './Auth.Saga';
import { workspaceSaga } from './Workspace.Saga';

export default function* rootSaga() {
  yield all([authSaga(), workspaceSaga()]);
}
