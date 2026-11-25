import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './Redux/Store/ConfigureStore';
import AppRoutes from './Navigation/AppRoutes';
import WebApi from './NetworkController/WebApi';
import { useAppSelector } from './Redux/hooks';
import './Assets/global.css';

function TokenBridge() {
  const token = useAppSelector((state) => state.auth.token);
  useEffect(() => { WebApi.setToken(token); }, [token]);
  return null;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <TokenBridge />
          <AppRoutes />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}
