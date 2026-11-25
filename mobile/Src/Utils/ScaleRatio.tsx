import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function scale(size: number) {
  return Math.round((width / 390) * size);
}
