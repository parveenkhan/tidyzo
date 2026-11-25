import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from './types';
import ServiceStack from './Stacks/ServiceStack';
import BookingStack from './Stacks/BookingStack';
import NotificationsScreen from '../Screens/NotificationScreen/NotificationsScreen';
import ProfileScreen from '../Screens/ProfileScreen/ProfileScreen';
import { Colors } from '../Assets/Colors';
import { useAppDispatch, useAppSelector } from '../Redux/hooks';
import { clearNotice } from '../Redux/Actions/Notification.Action';
import { openBooking } from './NavigationService';

const Tab = createBottomTabNavigator<TabParamList>();

function NoticeBanner() {
  const notice = useAppSelector((state) => state.notifications.notice);
  const dispatch = useAppDispatch();
  if (!notice) return null;
  return (
    <Pressable
      style={styles.banner}
      onPress={() => {
        dispatch(clearNotice());
        if (notice.bookingId) openBooking(notice.bookingId);
      }}>
      <Text style={styles.bannerTitle}>{notice.title}</Text>
      <Text style={styles.bannerBody}>{notice.body}</Text>
    </Pressable>
  );
}

export default function HomeStack() {
  const unread = useAppSelector((state) => state.notifications.unread);
  return (
    <View style={styles.root}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: { backgroundColor: Colors.card, borderTopColor: Colors.border },
        }}>
        <Tab.Screen
          name="ServicesTab"
          component={ServiceStack}
          options={{ title: 'Services', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="BookingsTab"
          component={BookingStack}
          options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }}
        />
        <Tab.Screen
          name="NotificationsTab"
          component={NotificationsScreen}
          options={{
            title: 'Alerts',
            tabBarBadge: unread > 0 ? unread : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }}
        />
      </Tab.Navigator>
      <NoticeBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  bannerTitle: { color: Colors.white, fontWeight: '800' },
  bannerBody: { color: '#E5F4EE' },
});
