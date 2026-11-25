import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  createTransform,
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '../Reducers';
import rootSaga from '../Saga/RootSaga';
import { LocalStorageKeys } from '../../Assets/LocalStorageKeys';

type AppState = ReturnType<typeof rootReducer>;
type AuthPersist = AppState['auth'];

const authTransform = createTransform(
  (inbound: AuthPersist): AuthPersist => ({
    ...inbound,
    token: null,
    ready: false,
    loading: false,
    error: null,
    challengeMobile: null,
    debugOtp: null,
  }),
  (outbound: AuthPersist): AuthPersist => ({
    ...outbound,
    token: null,
    ready: false,
    loading: false,
  }),
  { whitelist: ['auth'] },
);

const persistConfig: PersistConfig<AppState> = {
  key: LocalStorageKeys.persist,
  storage: AsyncStorage,
  whitelist: ['auth'],
  transforms: [authTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
