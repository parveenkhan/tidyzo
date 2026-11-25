import { memo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, Text } from 'react-native';
import { Colors } from '../Assets/Colors';
import { MAX_RANGE_KM, MIN_RANGE_KM } from '../Assets/places';

interface Props {
  value: number;
  onChange: (km: number) => void;
}

const THUMB = 28;

export function RangeSlider({ value, onChange }: Props) {
  const [shown, setShown] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const live = useRef((km: number) => setShown(km));
  const done = useRef((km: number) => {
    setShown(km);
    onChangeRef.current(km);
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={styles.label}>Range</Text>
        <Text style={styles.value}>{shown} km</Text>
      </View>
      <Track initial={value} onLive={live.current} onDone={done.current} />
      <View style={styles.ends}>
        <Text style={styles.end}>{MIN_RANGE_KM} km</Text>
        <Text style={styles.end}>{MAX_RANGE_KM} km</Text>
      </View>
    </View>
  );
}

const Track = memo(function Track({
  initial,
  onLive,
  onDone,
}: {
  initial: number;
  onLive: (km: number) => void;
  onDone: (km: number) => void;
}) {
  const width = useRef(0);
  const fill = useRef<View>(null);
  const thumb = useRef<View>(null);
  const live = useRef(onLive);
  const done = useRef(onDone);
  const lastKm = useRef(initial);
  const dragging = useRef(false);
  live.current = onLive;
  done.current = onDone;

  const place = (x: number, mode: 'live' | 'done' | 'none') => {
    const track = width.current;
    if (track <= 0) return;
    const clamped = Math.min(track, Math.max(0, x));
    const km = Math.round(MIN_RANGE_KM + (clamped / track) * (MAX_RANGE_KM - MIN_RANGE_KM));
    fill.current?.setNativeProps({ style: { width: clamped } });
    thumb.current?.setNativeProps({ style: { transform: [{ translateX: clamped - THUMB / 2 }] } });
    if (mode === 'none' || km === lastKm.current && mode !== 'done') return;
    lastKm.current = km;
    if (mode === 'done') done.current(km);
    else live.current(km);
  };

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: (_, gesture) => Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: (event) => {
      dragging.current = true;
      place(event.nativeEvent.locationX, 'live');
    },
    onPanResponderMove: (event, gesture) => {
      if (!dragging.current) return;
      if (Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx)) return;
      place(event.nativeEvent.locationX, 'live');
    },
    onPanResponderRelease: (event) => {
      if (!dragging.current) return;
      dragging.current = false;
      place(event.nativeEvent.locationX, 'done');
    },
    onPanResponderTerminate: () => {
      dragging.current = false;
    },
  })).current;

  return (
    <View
      style={styles.hit}
      {...pan.panHandlers}
      onLayout={(event) => {
        width.current = event.nativeEvent.layout.width;
        const ratio = (initial - MIN_RANGE_KM) / (MAX_RANGE_KM - MIN_RANGE_KM);
        place(ratio * width.current, 'none');
      }}>
      <View style={styles.rail}>
        <View ref={fill} style={styles.fill} />
      </View>
      <View ref={thumb} style={styles.thumb} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  value: { color: Colors.primary, fontSize: 18, fontWeight: '800' },
  hit: { height: 44, justifyContent: 'center' },
  rail: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  fill: { height: 6, width: 0, backgroundColor: Colors.primary },
  thumb: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  end: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
});
