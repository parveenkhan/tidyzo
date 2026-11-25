import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Screen } from '../../Component/Screen';
import { TextField } from '../../Component/TextField';
import { SelectField } from '../../Component/SelectField';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { Colors } from '../../Assets/Colors';
import { COUNTRIES, citiesFor, countryForCity, countryFromGeocode, matchCity, nearestCity, postalRule } from '../../Assets/places';
import { PaymentMethod } from '../../Assets/Types';
import { Strings } from '../../Assets/Strings';
import { ServiceStackParamList } from '../../Navigation/types';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { clearBookingError, createBooking } from '../../Redux/Actions/Booking.Action';
import { formatDateLabel, upcomingDates } from '../../Utils/DateUtils';
import { TIME_SLOTS, formatTimeLabel, isPastSlot } from '../../Utils/time';
import { inr } from '../../Utils/CommonFunction';
import { PLATFORM_FEE_PERCENT, paymentSplit } from '../../Utils/fees';

const PAYMENTS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Card' },
];

type Props = NativeStackScreenProps<ServiceStackParamList, 'BookService'>;

export default function BookServiceScreen({ route, navigation }: Props) {
  const service = useAppSelector((state) => state.services.items.find((item) => item.id === route.params.serviceId));
  const customer = useAppSelector((state) => state.auth.customer);
  const saving = useAppSelector((state) => state.bookings.saving);
  const error = useAppSelector((state) => state.bookings.error);
  const justBookedId = useAppSelector((state) => state.bookings.justBookedId);
  const dispatch = useAppDispatch();
  const dates = useMemo(() => upcomingDates(8), []);
  const [date, setDate] = useState(dates[0]);
  const [time, setTime] = useState('');
  const [addressLine, setAddress] = useState(customer?.addressLine || '');
  const savedCountry = countryForCity(customer?.city || '') || 'India';
  const [country, setCountry] = useState(savedCountry);
  const [city, setCity] = useState(matchCity(savedCountry, customer?.city || ''));
  const [pincode, setPincode] = useState(customer?.pincode || '');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const existingId = useRef(justBookedId);

  useEffect(() => {
    dispatch(clearBookingError());
  }, [dispatch]);

  useEffect(() => {
    if (justBookedId && justBookedId !== existingId.current) {
      navigation.replace('BookingSuccess', { bookingId: justBookedId });
    }
  }, [justBookedId, navigation]);

  const slots = TIME_SLOTS.filter((slot) => !isPastSlot(date, slot));
  const cities = citiesFor(country);
  const postal = postalRule(country);
  const pin = pincode.trim();
  const pinOk = postal.test(pin);
  const ready = Boolean(time) && addressLine.trim().length >= 8 && cities.includes(city) && pinOk;
  const issues = [
    !time ? (slots.length === 0 ? 'No slots left today. Choose another date.' : 'Choose a time slot.') : '',
    addressLine.trim().length < 8 ? 'Address needs at least 8 characters.' : '',
    cities.includes(city) ? '' : 'Select a city.',
    pinOk ? '' : (postal.required ? `Enter a ${postal.hint}.` : `Enter a valid ${postal.hint}, or leave it empty.`),
    locError,
    error || '',
  ].filter(Boolean);

  const useCurrent = async () => {
    setLocating(true);
    setLocError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocError('Allow location access, or type the address.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const nearest = nearestCity(position.coords.latitude, position.coords.longitude);
      const nextCountry = countryFromGeocode(place?.country, place?.isoCountryCode) || countryForCity(nearest) || 'India';
      const named = matchCity(nextCountry, place?.city || place?.subregion || place?.district || '') || nearest;
      const resolvedCountry = countryForCity(named) || nextCountry;
      const line = [place?.name, place?.streetNumber, place?.street, place?.district]
        .map((part) => (part || '').trim())
        .filter((part, index, all) => part && all.indexOf(part) === index)
        .join(', ');
      setCountry(resolvedCountry);
      setCity(matchCity(resolvedCountry, named));
      setAddress(line.length >= 8 ? line : `${named} current location`);
      const code = (place?.postalCode || '').replace(/\s+/g, ' ').trim();
      setPincode(postalRule(resolvedCountry).test(code) ? code : '');
    } catch {
      setLocError('Could not read your location. Type the address instead.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{service?.name || 'Service'}</Text>
        <Text style={styles.title}>Pick a slot</Text>
        <Text style={styles.label}>Date</Text>
        <View style={styles.wrap}>
          {dates.map((item) => (
            <Pressable key={item} onPress={() => { setDate(item); setTime(''); }} style={[styles.chip, date === item && styles.chipOn]}>
              <Text style={[styles.chipText, date === item && styles.chipTextOn]}>{formatDateLabel(item)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Time</Text>
        <View style={styles.wrap}>
          {slots.length === 0 ? <Text style={styles.hint}>No slots left today. Choose another date.</Text> : null}
          {slots.map((item) => (
            <Pressable key={item} onPress={() => setTime(item)} style={[styles.chip, time === item && styles.chipOn]}>
              <Text style={[styles.chipText, time === item && styles.chipTextOn]}>{formatTimeLabel(item)}</Text>
            </Pressable>
          ))}
        </View>
        <TextField label="Address" value={addressLine} onChangeText={setAddress} placeholder="Flat, street, landmark" />
        <Pressable style={styles.locate} onPress={useCurrent} disabled={locating}>
          <Text style={styles.locateText}>{locating ? 'Finding you…' : 'Use current location'}</Text>
        </Pressable>
        <SelectField
          label="Country"
          value={country}
          placeholder="Select country"
          options={COUNTRIES}
          onChange={(next) => {
            setCountry(next);
            if (!citiesFor(next).includes(city)) setCity('');
            setPincode('');
          }}
        />
        <SelectField
          label="City"
          value={city}
          placeholder="Select city"
          options={cities}
          onChange={setCity}
        />
        <TextField
          label={postal.required ? postal.label : `${postal.label} (optional)`}
          value={pincode}
          onChangeText={setPincode}
          keyboardType={postal.keyboard}
          autoCapitalize="characters"
          maxLength={postal.maxLength}
          placeholder={postal.placeholder}
        />
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" />
        <Text style={styles.label}>Payment</Text>
        <View style={styles.wrap}>
          {PAYMENTS.map((item) => (
            <Pressable key={item.id} onPress={() => setPayment(item.id)} style={[styles.chip, payment === item.id && styles.chipOn]}>
              <Text style={[styles.chipText, payment === item.id && styles.chipTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>
          {service
            ? `Pay ${inr(service.price)} with ${payment === 'upi' ? 'UPI' : 'card'}. TidyZo keeps ${inr(paymentSplit(service.price).platformFee)} (${PLATFORM_FEE_PERCENT}%) and the professional receives ${inr(paymentSplit(service.price).providerAmount)}.`
            : 'Choose UPI or card. TidyZo deducts its fee from this payment.'}
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        {issues.map((item) => <Text key={item} style={styles.error}>{item}</Text>)}
        <PrimaryButton
          title={service ? `Pay ${inr(service.price)}` : Strings.confirmBooking}
          loading={saving}
          disabled={!ready || !service}
          onPress={() => service && dispatch(createBooking({
            serviceId: service.id,
            date,
            time,
            addressLine: addressLine.trim(),
            city: city.trim(),
            country,
            pincode: pin,
            notes: notes.trim(),
            paymentMethod: payment,
          }))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12, paddingBottom: 24 },
  kicker: { color: Colors.primary, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  label: { color: Colors.textSecondary, fontWeight: '700', marginTop: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text },
  chipTextOn: { color: Colors.white, fontWeight: '700' },
  hint: { color: Colors.textSecondary },
  locate: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  locateText: { color: Colors.primary, fontWeight: '800' },
  error: { color: Colors.danger, fontWeight: '700' },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 8 },
});
