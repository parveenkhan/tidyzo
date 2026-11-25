import * as Haptics from 'expo-haptics';

export function tap() {
  Haptics.selectionAsync().catch(() => undefined);
}
