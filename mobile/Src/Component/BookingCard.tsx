import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../Assets/Colors';
import { Booking } from '../Assets/Types';
import { StatusBadge } from './StatusBadge';
import { inr } from '../Utils/CommonFunction';
import { formatDateLabel } from '../Utils/DateUtils';
import { formatTimeLabel } from '../Utils/time';

export function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{booking.serviceName}</Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text style={styles.meta}>{formatDateLabel(booking.date)} · {formatTimeLabel(booking.time)}</Text>
      <Text style={styles.meta}>{booking.addressLine}, {booking.city}</Text>
      <Text style={styles.price}>{inr(booking.price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontSize: 13 },
  price: { color: Colors.primary, fontWeight: '700', marginTop: 4 },
});
