import { useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../Component/Screen';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { StatusBadge } from '../../Component/StatusBadge';
import { Colors } from '../../Assets/Colors';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { updateProviderJob } from '../../Redux/Reducers/Booking.Reducer';
import { formatDateLabel } from '../../Utils/DateUtils';
import { formatTimeLabel } from '../../Utils/time';
import { inr } from '../../Utils/CommonFunction';

type Params = { ProviderJobDetail: { bookingId: string } };
type Props = NativeStackScreenProps<Params, 'ProviderJobDetail'>;

export default function ProviderJobDetailScreen({ route, navigation }: Props) {
  const booking = useAppSelector((state) => state.bookings.items.find((item) => item.id === route.params.bookingId));
  const saving = useAppSelector((state) => state.bookings.saving);
  const error = useAppSelector((state) => state.bookings.error);
  const dispatch = useAppDispatch();
  const seen = useRef(false);
  if (booking) seen.current = true;

  useEffect(() => {
    if (seen.current && !booking) navigation.goBack();
  }, [booking, navigation]);

  if (!booking) {
    return <Screen edges={[]}><View style={styles.missing}><Text>Open this job from your list.</Text></View></Screen>;
  }

  const reject = () => {
    Alert.alert('Reject this job?', 'It goes back to TidyZo so another professional can be assigned.', [
      { text: 'Keep job', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => dispatch(updateProviderJob({ id: booking.id, status: 'rejected' })) },
    ]);
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{booking.status === 'pending' || booking.status === 'assigned' ? 'New assignment' : 'Your job'}</Text>
        <Text style={styles.title}>{booking.serviceName}</Text>
        <StatusBadge status={booking.status} />
        <Text style={styles.line}>{booking.customerName} · +91 {booking.customerMobile}</Text>
        <Text style={styles.line}>{formatDateLabel(booking.date)} · {formatTimeLabel(booking.time)}</Text>
        <Text style={styles.line}>{booking.addressLine}</Text>
        <Text style={styles.line}>{booking.city} {booking.pincode}</Text>
        {booking.paymentMethod === 'upi' || booking.paymentMethod === 'card' ? (
          <Text style={styles.line}>You receive {inr(booking.providerAmount || 0)} after TidyZo’s fee of {inr(booking.platformFee || 0)}.</Text>
        ) : null}
        {booking.notes ? <Text style={styles.line}>Note: {booking.notes}</Text> : null}
      </ScrollView>
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {booking.status === 'pending' || booking.status === 'assigned' ? (
          <View style={styles.actions}>
            <PrimaryButton title="Reject" light disabled={saving} style={styles.action} onPress={reject} />
            <PrimaryButton title="Accept" loading={saving} style={styles.action} onPress={() => dispatch(updateProviderJob({ id: booking.id, status: 'accepted' }))} />
          </View>
        ) : null}
        {booking.status === 'accepted' ? (
          <PrimaryButton title="Start visit" loading={saving} onPress={() => dispatch(updateProviderJob({ id: booking.id, status: 'in_progress' }))} />
        ) : null}
        {booking.status === 'in_progress' ? (
          <PrimaryButton title="Mark completed" loading={saving} onPress={() => dispatch(updateProviderJob({ id: booking.id, status: 'completed' }))} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 10 },
  kicker: { color: Colors.primary, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  line: { color: Colors.textSecondary, fontSize: 15 },
  error: { color: Colors.danger, fontWeight: '700' },
  footer: { padding: 20, gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  missing: { flex: 1, padding: 24, justifyContent: 'center' },
});
