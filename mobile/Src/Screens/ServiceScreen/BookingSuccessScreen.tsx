import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { StatusBadge } from '../../Component/StatusBadge';
import { Colors } from '../../Assets/Colors';
import { ServiceStackParamList } from '../../Navigation/types';
import { useAppSelector } from '../../Redux/hooks';
import { formatDateLabel } from '../../Utils/DateUtils';
import { formatTimeLabel } from '../../Utils/time';
import { paymentLabel } from '../../Utils/CommonFunction';

type Props = NativeStackScreenProps<ServiceStackParamList, 'BookingSuccess'>;

export default function BookingSuccessScreen({ route, navigation }: Props) {
  const booking = useAppSelector((state) => state.bookings.items.find((item) => item.id === route.params.bookingId));

  return (
    <Screen edges={['bottom']}>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.kicker}>Request sent</Text>
          <Text style={styles.title}>We have your booking.</Text>
          <Text style={styles.copy}>TidyZo will confirm it. Status updates show up in Alerts.</Text>
          {booking ? (
            <View style={styles.card}>
              <Text style={styles.name}>{booking.serviceName}</Text>
              <Text style={styles.meta}>{formatDateLabel(booking.date)} · {formatTimeLabel(booking.time)}</Text>
              <Text style={styles.meta}>{paymentLabel(booking.paymentMethod, booking.paymentStatus)}</Text>
              <StatusBadge status={booking.status} />
            </View>
          ) : null}
        </View>
        <PrimaryButton
          title="View bookings"
          style={styles.button}
          onPress={() => navigation.getParent()?.navigate('BookingsTab')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  top: { gap: 10 },
  kicker: { color: Colors.primary, fontWeight: '800' },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -0.3 },
  copy: { color: Colors.textSecondary, fontSize: 16, lineHeight: 22 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.text },
  meta: { color: Colors.textSecondary },
  button: { marginTop: 'auto', marginBottom: 16 },
});
