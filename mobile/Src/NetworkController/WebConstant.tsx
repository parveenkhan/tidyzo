import Constants from 'expo-constants';

function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
  // The simulator rejects the local self-signed certificate. The app uses the
  // local HTTP port. The admin dashboard still talks to HTTPS on port 8443.
  return `http://${host}:8080`;
}

class WebConstant {
  static GET = 'GET';
  static POST = 'POST';
  static PUT = 'PUT';
  static PATCH = 'PATCH';
  static DELETE = 'DELETE';
  static timeout = 30000;
  static BASE_URL = resolveBaseUrl();
}

export default WebConstant;
