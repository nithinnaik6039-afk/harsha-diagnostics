// src/utils/pushNotification.js
// Expo Push Notification Server Utility
// Sends push alerts to Customer App and MLT App via Expo's push service.
// Expo forwards messages to FCM (Android) and APNs (iOS) automatically.

import Expo from 'expo-server-sdk';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Send a single push notification
 * @param {string} expoPushToken - Expo push token stored in User/MLT model
 * @param {string} title         - Notification title
 * @param {string} body          - Notification body text
 * @param {object} data          - Extra data payload (e.g. { orderId, screen })
 */
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  // Silently skip if no token registered
  if (!expoPushToken) return;

  // Validate Expo push token format
  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.warn(`[Push] Invalid Expo push token: ${expoPushToken}`);
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'harsha-diagnostics' // Android notification channel
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      receipts.forEach((receipt) => {
        if (receipt.status === 'error') {
          console.error(`[Push] Delivery error — ${receipt.message}`, receipt.details);
        }
      });
    }
    console.log(`[Push] ✅ Sent to ${expoPushToken.substring(0, 30)}… | "${title}"`);
  } catch (error) {
    // Never crash the main flow because of notification failure
    console.error('[Push] sendPushNotification failed:', error.message);
  }
};

/**
 * Send push to multiple recipients (batch)
 * @param {string[]} tokens
 * @param {string}   title
 * @param {string}   body
 * @param {object}   data
 */
export const sendBulkPushNotification = async (tokens = [], title, body, data = {}) => {
  const validMessages = tokens
    .filter((t) => t && Expo.isExpoPushToken(t))
    .map((to) => ({ to, sound: 'default', title, body, data, priority: 'high', channelId: 'harsha-diagnostics' }));

  if (validMessages.length === 0) return;

  try {
    const chunks = expo.chunkPushNotifications(validMessages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    console.log(`[Push] ✅ Batch sent to ${validMessages.length} recipients — "${title}"`);
  } catch (error) {
    console.error('[Push] sendBulkPushNotification failed:', error.message);
  }
};
