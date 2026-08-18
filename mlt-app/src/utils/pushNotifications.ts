import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';

// Configure notification behavior when app is in foreground
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true
    }),
  });
}

/**
 * Registers for push notifications and sends the token to our backend
 * @param token User auth token for backend request
 * @param backendUrl Base URL of backend
 */
export async function registerForPushNotificationsAsync(token: string, backendUrl: string) {
  let expoPushToken;

  if (Platform.OS === 'web') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('harsha-diagnostics', {
      name: 'Harsha Diagnostics Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284c7',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      expoPushToken = tokenResponse.data;
      
      console.log('Got Expo Push Token:', expoPushToken);
      
      // Send the token to the backend
      await axios.patch(
        `${backendUrl}/api/auth/push-token`,
        { expoPushToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Successfully registered push token with backend');
    } catch (e) {
      console.error('Error fetching/sending push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return expoPushToken;
}
