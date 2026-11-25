import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './NavigationService';
import { useAppDispatch, useAppSelector } from '../Redux/hooks';
import { bootstrap } from '../Redux/Actions/Auth.Action';
import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import ProviderStack from './ProviderStack';
import SplashScreen from '../Screens/AuthScreen/SplashScreen';

export default function MainNavigation() {
  const ready = useAppSelector((state) => state.auth.ready);
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);

  return (
    <NavigationContainer ref={navigationRef}>
      {!ready ? <SplashScreen /> : token && role === 'provider' ? <ProviderStack /> : token ? <HomeStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
