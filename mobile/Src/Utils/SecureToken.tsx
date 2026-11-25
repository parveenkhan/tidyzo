import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LocalStorageKeys } from '../Assets/LocalStorageKeys';

export async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(LocalStorageKeys.token, token);
    return;
  }
  await SecureStore.setItemAsync(LocalStorageKeys.token, token);
}

export async function readToken() {
  if (Platform.OS === 'web') return sessionStorage.getItem(LocalStorageKeys.token);
  return SecureStore.getItemAsync(LocalStorageKeys.token);
}

export function roleFromToken(token: string) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { role?: string };
    if (payload.role === 'provider' || payload.role === 'customer') return payload.role;
    return null;
  } catch {
    return null;
  }
}

export async function clearToken() {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(LocalStorageKeys.token);
    return;
  }
  await SecureStore.deleteItemAsync(LocalStorageKeys.token);
}
