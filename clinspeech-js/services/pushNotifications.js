import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiFetch } from '../api';

const PUSH_TOKEN_ENDPOINT = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

async function savePushToken(token) {
  if (!token) return;

  // TODO: backend currently has no endpoint for Expo push tokens.
  // When it appears, set PUSH_TOKEN_ENDPOINT to that path, for example:
  // '/notifications/register_device/'.
  if (!PUSH_TOKEN_ENDPOINT) {
    console.log('Expo push token received, backend endpoint is not configured yet.');
    return;
  }

  const response = await apiFetch(PUSH_TOKEN_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      provider: 'expo',
    }),
  });

  if (!response.ok) {
    console.error('Push token save failed:', response.status);
  }
}

function getExpoProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    Constants.manifest2?.extra?.eas?.projectId ||
    Constants.manifest?.extra?.eas?.projectId ||
    null
  );
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;
  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission was not granted.');
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.log('Expo push token skipped: EAS projectId is not configured.');
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;
  await savePushToken(token);
  return token;
}

export function usePushNotificationHandlers(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    registerForPushNotifications().catch((error) => {
      console.error('Push notification registration failed:', error);
    });

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Foreground notification:', notification);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [enabled]);
}
