import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../Component/Screen';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { markAllRead, markRead, refreshInbox } from '../../Redux/Actions/Notification.Action';
import { openBooking } from '../../Navigation/NavigationService';

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.notifications.items);

  useFocusEffect(useCallback(() => {
    dispatch(refreshInbox());
  }, [dispatch]));

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{Strings.alerts}</Text>
            <Pressable onPress={() => dispatch(markAllRead())}><Text style={styles.mark}>Mark all read</Text></Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              dispatch(markRead(item.id));
              if (item.bookingId) openBooking(item.bookingId);
            }}
            style={[styles.card, !item.isRead && styles.unread]}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>Booking updates will land here.</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text },
  mark: { color: Colors.primary, fontWeight: '700' },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: Colors.border },
  unread: { borderColor: Colors.primary },
  cardTitle: { fontWeight: '800', color: Colors.text, fontSize: 16 },
  body: { color: Colors.textSecondary, lineHeight: 20 },
  time: { color: Colors.textMuted, fontSize: 12 },
  empty: { color: Colors.textSecondary },
});
