import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import WebApi from '../NetworkController/WebApi';
import { useAppDispatch, useAppSelector } from '../Redux/hooks';
import { refreshInbox } from '../Redux/Actions/Notification.Action';
import { updateProfile } from '../Redux/Actions/Auth.Action';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function NotificationBridge() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  const notice = useAppSelector((state) => state.notifications.notice);
  const asked = useRef(false);

  useEffect(() => {
    WebApi.setToken(token);
  }, [token]);

  useEffect(() => {
    if (!token || (role !== 'customer' && role !== 'provider')) return undefined;
    dispatch(refreshInbox());
    const timer = setInterval(() => dispatch(refreshInbox()), 5000);
    return () => clearInterval(timer);
  }, [dispatch, role, token]);

  useEffect(() => {
    if (!token || Platform.OS === 'web' || asked.current) return;
    if (role !== 'customer' && role !== 'provider') return;
    asked.current = true;
    Notifications.requestPermissionsAsync()
      .then(() => (role === 'customer' ? Notifications.getDevicePushTokenAsync() : null))
      .then((device) => {
        if (device?.data) dispatch(updateProfile({ fcmToken: String(device.data) }));
      })
      .catch(() => undefined);
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('bookings', {
        name: 'Bookings',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => undefined);
    }
  }, [dispatch, role, token]);

  useEffect(() => {
    if (!notice || Platform.OS === 'web') return;
    Notifications.scheduleNotificationAsync({
      content: { title: notice.title, body: notice.body, data: { bookingId: notice.bookingId || '' } },
      trigger: null,
    }).catch(() => undefined);
  }, [notice]);

  return null;
}
