import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Screen } from '../../Component/Screen';
import { PrimaryButton } from '../../Component/PrimaryButton';
import { SelectField } from '../../Component/SelectField';
import { RangeSlider } from '../../Component/RangeSlider';
import { LocationMap } from '../../Component/LocationMap';
import { Colors } from '../../Assets/Colors';
import { Strings } from '../../Assets/Strings';
import { COUNTRIES, citiesFor, cityPoint, countryForCity, matchCity, nearestCity } from '../../Assets/places';
import { useAppDispatch, useAppSelector } from '../../Redux/hooks';
import { logout, updateProviderArea } from '../../Redux/Actions/Auth.Action';

interface ChosenPoint {
  latitude: number;
  longitude: number;
  label: string;
}

export default function ProviderProfileScreen() {
  const provider = useAppSelector((state) => state.auth.provider);
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const dispatch = useAppDispatch();
  const savedCountry = countryForCity(provider?.city || '') || 'India';
  const savedPoint = cityPoint(provider?.city || '');
  const [country, setCountry] = useState(savedCountry);
  const [city, setCity] = useState(matchCity(savedCountry, provider?.city || ''));
  const [rangeKm, setRangeKm] = useState(provider?.rangeKm || 25);
  const [point, setPoint] = useState<ChosenPoint | null>(
    provider?.latitude != null && provider.longitude != null
      ? { latitude: provider.latitude, longitude: provider.longitude, label: provider.city || nearestCity(provider.latitude, provider.longitude) }
      : savedPoint
        ? { latitude: savedPoint.latitude, longitude: savedPoint.longitude, label: savedPoint.city }
        : null,
  );
  const [saved, setSaved] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const cities = citiesFor(country);

  const applyPoint = (latitude: number, longitude: number) => {
    const label = nearestCity(latitude, longitude);
    setPoint({ latitude, longitude, label });
    setCity(label);
    setCountry(countryForCity(label) || 'India');
    setSaved(false);
    setLocError('');
  };

  const useCurrent = async () => {
    setLocating(true);
    setLocError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocError('Allow location access, or pick a point on the map.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyPoint(position.coords.latitude, position.coords.longitude);
    } catch {
      setLocError('Could not read your location. Pick a point on the map.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>Service provider</Text>
        <Text style={styles.title}>{provider?.name || 'Profile'}</Text>
        <Text style={styles.line}>{provider?.skill}</Text>
        <Text style={styles.line}>+91 {provider?.phone}</Text>
        <Text style={styles.section}>Work area</Text>
        <Text style={styles.hint}>Choose a city, use your current location, or drop a pin on the map. You can change this any time.</Text>
        <SelectField
          label="Country"
          value={country}
          placeholder="Select country"
          options={COUNTRIES}
          onChange={(next) => {
            setCountry(next);
            setSaved(false);
            if (!citiesFor(next).includes(city)) {
              setCity('');
              setPoint(null);
            }
          }}
        />
        <SelectField
          label="City"
          value={city}
          placeholder="Select city"
          options={cities}
          onChange={(next) => {
            setCity(next);
            setSaved(false);
            const named = cityPoint(next);
            if (named) setPoint({ latitude: named.latitude, longitude: named.longitude, label: named.city });
          }}
        />
        <View style={styles.choices}>
          <Pressable style={styles.choice} onPress={useCurrent} disabled={locating}>
            <Text style={styles.choiceText}>{locating ? 'Finding you…' : 'Current location'}</Text>
          </Pressable>
          <Pressable style={styles.choice} onPress={() => setMapOpen(true)}>
            <Text style={styles.choiceText}>Pick on map</Text>
          </Pressable>
        </View>
        {point ? <Text style={styles.point}>{point.label} · {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</Text> : null}
        {locError ? <Text style={styles.error}>{locError}</Text> : null}
        <RangeSlider value={rangeKm} onChange={(next) => { setRangeKm(next); setSaved(false); }} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved && !loading && !error ? <Text style={styles.saved}>Location saved. Nearby jobs will use this area.</Text> : null}
        <PrimaryButton
          title="Save location"
          loading={loading}
          disabled={!point}
          onPress={() => {
            if (!point) return;
            setSaved(true);
            dispatch(updateProviderArea({
              city: point.label,
              rangeKm,
              latitude: point.latitude,
              longitude: point.longitude,
            }));
          }}
        />
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton title={Strings.logout} light onPress={() => dispatch(logout())} />
      </View>
      {mapOpen ? (
        <LocationMap
          visible
          initial={point ?? { latitude: 26.9124, longitude: 75.7873 }}
          onClose={() => setMapOpen(false)}
          onConfirm={(next) => {
            applyPoint(next.latitude, next.longitude);
            setMapOpen(false);
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, gap: 12, paddingBottom: 16 },
  kicker: { color: Colors.primary, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 30, fontWeight: '800' },
  line: { color: Colors.textSecondary, fontSize: 16 },
  section: { color: Colors.text, fontSize: 18, fontWeight: '800', marginTop: 8 },
  hint: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  choices: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  choiceText: { color: Colors.primary, fontWeight: '800' },
  point: { color: Colors.text, fontWeight: '700' },
  error: { color: Colors.danger, fontWeight: '700' },
  saved: { color: Colors.primary, fontWeight: '700' },
  footer: { padding: 20 },
});
