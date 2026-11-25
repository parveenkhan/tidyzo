import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../Assets/Colors';
import { Service } from '../Assets/Types';
import { inr } from '../Utils/CommonFunction';

export function ServiceCard({ service, onPress }: { service: Service; onPress: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {failed ? (
        <View style={[styles.image, styles.fallback]}>
          <Text style={styles.fallbackText}>{service.category}</Text>
        </View>
      ) : (
        <Image source={{ uri: service.imageUrl }} style={styles.image} onError={() => setFailed(true)} />
      )}
      <View style={styles.body}>
        <Text style={styles.category}>{service.category}</Text>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.meta}>{inr(service.price)} · {service.durationMin} min</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: { width: '100%', height: 150 },
  fallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: Colors.white, fontWeight: '700' },
  body: { padding: 14, gap: 4 },
  category: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  name: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: Colors.textSecondary, fontSize: 14 },
});
