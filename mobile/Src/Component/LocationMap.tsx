import { useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../Assets/Colors';
import { PrimaryButton } from './PrimaryButton';

const TILE = 256;

interface Point {
  latitude: number;
  longitude: number;
}

interface Props {
  visible: boolean;
  initial: Point;
  onClose: () => void;
  onConfirm: (point: Point) => void;
}

export function LocationMap({ visible, initial, onClose, onConfirm }: Props) {
  const [center, setCenter] = useState(initial);
  const [zoom, setZoom] = useState(13);
  const [draft, setDraft] = useState(initial);
  const layer = useRef<View>(null);
  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  centerRef.current = center;
  zoomRef.current = zoom;

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      layer.current?.setNativeProps({
        style: { transform: [{ translateX: gesture.dx }, { translateY: gesture.dy }] },
      });
    },
    onPanResponderRelease: (_, gesture) => {
      const next = shiftPoint(centerRef.current, zoomRef.current, gesture.dx, gesture.dy);
      layer.current?.setNativeProps({ style: { transform: [{ translateX: 0 }, { translateY: 0 }] } });
      setCenter(next);
      setDraft(next);
    },
    onPanResponderTerminate: () => {
      layer.current?.setNativeProps({ style: { transform: [{ translateX: 0 }, { translateY: 0 }] } });
    },
  })).current;

  const projected = project(center.latitude, center.longitude, zoom);
  const tileX = Math.floor(projected.x / TILE);
  const tileY = Math.floor(projected.y / TILE);
  const originX = tileX * TILE - projected.x;
  const originY = tileY * TILE - projected.y;
  const tiles = [];
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      tiles.push({ col, row, x: wrapTile(tileX + col, zoom), y: tileY + row });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Pick a location</Text>
          <View style={styles.zoom}>
            <Pressable onPress={() => setZoom((value) => Math.min(16, value + 1))} style={styles.zoomBtn}>
              <Text style={styles.zoomText}>+</Text>
            </Pressable>
            <Pressable onPress={() => setZoom((value) => Math.max(4, value - 1))} style={styles.zoomBtn}>
              <Text style={styles.zoomText}>−</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.map} {...pan.panHandlers}>
          <View ref={layer} style={[styles.layer, { left: originX, top: originY }]}>
            {tiles.map((tile) => (
              tile.y < 0 || tile.y >= 2 ** zoom ? null : (
                <Image
                  key={`${zoom}-${tile.x}-${tile.y}`}
                  source={{ uri: `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tile.x}/${tile.y}.png` }}
                  style={[styles.tile, { left: tile.col * TILE, top: tile.row * TILE }]}
                />
              )
            ))}
          </View>
          <View pointerEvents="none" style={styles.pinWrap}>
            <Ionicons name="location" size={36} color={Colors.primary} style={styles.pin} />
          </View>
        </View>
        <Text style={styles.coords}>{draft.latitude.toFixed(4)}, {draft.longitude.toFixed(4)}</Text>
        <Text style={styles.hint}>Drag the map. The pin stays in the centre.</Text>
        <PrimaryButton title="Use this point" onPress={() => onConfirm(draft)} style={styles.button} />
      </View>
    </Modal>
  );
}

function project(latitude: number, longitude: number, zoom: number) {
  const size = TILE * 2 ** zoom;
  const x = ((longitude + 180) / 360) * size;
  const sin = Math.sin((latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  return { x, y };
}

function unproject(x: number, y: number, zoom: number) {
  const size = TILE * 2 ** zoom;
  const longitude = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return {
    latitude: Math.min(80, Math.max(-80, latitude)),
    longitude,
  };
}

function shiftPoint(point: Point, zoom: number, dx: number, dy: number) {
  const projected = project(point.latitude, point.longitude, zoom);
  return unproject(projected.x - dx, projected.y - dy, zoom);
}

function wrapTile(value: number, zoom: number) {
  const count = 2 ** zoom;
  return ((value % count) + count) % count;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  zoom: { flexDirection: 'row', gap: 8 },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  map: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#D7E3DC' },
  layer: { position: 'absolute', width: TILE, height: TILE },
  tile: { position: 'absolute', width: TILE, height: TILE },
  pinWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pin: { marginBottom: 36 },
  coords: { color: Colors.text, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  hint: { color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  button: { marginBottom: 8 },
});
