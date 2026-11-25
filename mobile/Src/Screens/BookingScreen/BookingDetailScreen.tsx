import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../Component/Screen';
import { StatusBadge } from '../../Component/StatusBadge';
import { Colors } from '../../Assets/Colors';
import { BookingStackParamList } from '../../Navigation/types';
import { useAppSelector } from '../../Redux/hooks';
import { formatDateLabel } from '../../Utils/DateUtils';
import { formatTimeLabel } from '../../Utils/time';
import { inr, paymentLabel } from '../../Utils/CommonFunction';
import { BookingStatus } from '../../Assets/Types';

type Props = NativeStackScreenProps<BookingStackParamList, 'BookingDetail'>;

const STEPS: Array<{ key: BookingStatus; label: string }> = [
  { key: 'pending', label: 'Requested' },
  { key: 'approved', label: 'Confirmed' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_COPY: Record<BookingStatus, string> = {
  pending: 'Waiting for TidyZo to confirm this visit.',
  approved: 'Confirmed. A professional will be assigned next.',
  assigned: 'A professional is assigned and can accept this visit.',
  accepted: 'Your professional accepted this visit.',
  in_progress: 'The visit is underway.',
  completed: 'This visit is complete.',
  cancelled: 'This booking was cancelled.',
};

export default function BookingDetailScreen({ route }: Props) {
  const booking = useAppSelector((state) => state.bookings.items.find((item) => item.id === route.params.bookingId));
  if (!booking) {
    return (
      <Screen edges={[]}>
        <View style={styles.missing}>
          <View style={styles.missingIcon}>
            <Ionicons name="calendar-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.missingTitle}>Booking not loaded</Text>
          <Text style={styles.missingCopy}>This booking is not on this device yet. Go back and pull the list to refresh.</Text>
        </View>
      </Screen>
    );
  }

  const current = STEPS.findIndex((step) => step.key === booking.status);
  const cancelled = booking.status === 'cancelled';

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{booking.category || 'Home visit'}</Text>
          <Text style={styles.title}>{booking.serviceName}</Text>
          <StatusBadge status={booking.status} />
          <Text style={styles.summary}>{STATUS_COPY[booking.status]}</Text>
          <View style={styles.priceBand}>
            <Text style={styles.priceLabel}>Visit total</Text>
            <Text style={styles.price}>{inr(booking.price)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <DetailRow icon="calendar-outline" label="Date" value={formatDateLabel(booking.date)} />
          <View style={styles.divider} />
          <DetailRow icon="time-outline" label="Time" value={formatTimeLabel(booking.time)} />
        </View>

        <View style={styles.card}>
          <DetailRow
            icon="location-outline"
            label="Address"
            value={`${booking.addressLine}\n${booking.city} ${booking.pincode}`}
          />
        </View>

        <View style={styles.card}>
          <DetailRow icon="card-outline" label="Payment" value={paymentLabel(booking.paymentMethod, booking.paymentStatus)} />
          {booking.paymentMethod === 'upi' || booking.paymentMethod === 'card' ? (
            <>
              <View style={styles.divider} />
              <DetailRow icon="cut-outline" label="TidyZo fee" value={inr(booking.platformFee || 0)} />
              <View style={styles.divider} />
              <DetailRow icon="wallet-outline" label="Professional receives" value={inr(booking.providerAmount || 0)} />
            </>
          ) : null}
        </View>

        {booking.professionalName ? (
          <View style={styles.card}>
            <DetailRow icon="person-outline" label="Professional" value={booking.professionalName} />
          </View>
        ) : null}

        {booking.notes ? (
          <View style={styles.card}>
            <Text style={styles.section}>Notes</Text>
            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        ) : null}

        {cancelled ? (
          <View style={styles.cancelled}>
            <Ionicons name="close-circle" size={20} color={Colors.danger} />
            <Text style={styles.cancelledText}>This booking was cancelled and will not be visited.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.section}>Progress</Text>
            {STEPS.map((step, index) => {
              const reached = index <= current;
              const done = index < current;
              const active = index === current;
              const last = index === STEPS.length - 1;
              return (
                <View key={step.key} style={styles.step}>
                  <View style={styles.rail}>
                    <View style={[styles.dot, reached && styles.dotOn, active && styles.dotCurrent]}>
                      {done ? <Ionicons name="checkmark" size={12} color={Colors.white} /> : null}
                      {active ? <View style={styles.dotCore} /> : null}
                    </View>
                    {last ? null : <View style={[styles.line, done && styles.lineOn]} />}
                  </View>
                  <View style={[styles.stepBody, last && styles.stepBodyLast]}>
                    <Text style={[styles.stepLabel, reached && styles.stepLabelOn]}>{step.label}</Text>
                    {active ? <Text style={styles.stepHint}>Current step</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36, gap: 14 },
  hero: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 8,
  },
  kicker: { color: Colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  summary: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, marginTop: 2 },
  priceBand: {
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  price: { color: Colors.primary, fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E7F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  rowValue: { color: Colors.text, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  section: { color: Colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  notes: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22 },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: 22, alignItems: 'center' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotCurrent: { backgroundColor: Colors.card, borderColor: Colors.primary },
  dotCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border, marginVertical: 3 },
  lineOn: { backgroundColor: Colors.primary },
  stepBody: { flex: 1, paddingBottom: 16, paddingTop: 1 },
  stepBodyLast: { paddingBottom: 0 },
  stepLabel: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
  stepLabelOn: { color: Colors.text, fontWeight: '700' },
  stepHint: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.dangerSoft,
    borderRadius: 16,
    padding: 16,
  },
  cancelledText: { flex: 1, color: Colors.danger, fontWeight: '700', lineHeight: 20 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  missingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E7F3EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  missingTitle: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  missingCopy: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, textAlign: 'center' },
});
