import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { BookingCard } from '../../Component/BookingCard';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { BookingStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { fetchBookings } from '../../Redux/Actions/Booking.Action';

type Props = NativeStackScreenProps<BookingStackParamList, 'BookingHistory'>;

export default function BookingHistoryScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.bookings.items);
  const error = useAppSelector((state) => state.bookings.error);

  useFocusEffect(useCallback(() => {
    dispatch(fetchBookings());
  }, [dispatch]));

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>{Strings.bookings}</Text>}
        renderItem={({ item }) => (
          <BookingCard booking={item} onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={<Text style={styles.empty}>{error || 'Bookings you make will show up here.'}</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  empty: { color: Colors.textSecondary, marginTop: 12 },
});
