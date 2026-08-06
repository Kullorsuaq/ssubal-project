import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, StatusBar, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import CookieManager from '@react-native-cookies/cookies';

//SDK 54 스펙 적용
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const webViewRef = useRef<WebView>(null);
  const lastProcessedNotificationId = useRef<string | null>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      const data = response.notification.request.content.data as Record<string, any>;

      const validTypes = [
        "NEW_COMMENT",
        "SCHEDULE_UPDATE",
        "POST_SUB_ACCEPT",
        "POST_SUB_APPLY"
      ];

      if (
        data &&
        validTypes.includes(data.type) &&
        webViewRef.current &&
        lastProcessedNotificationId.current !== notificationId
      ) {
        lastProcessedNotificationId.current = notificationId;

        setTimeout(() => {
          webViewRef.current?.postMessage(JSON.stringify(data));
        }, 500);
      }
    });

    return () => subscription.remove();
  }, []);

  async function getRealPushToken() {
    if (!Device.isDevice) {
      Alert.alert('알림', '실물 스마트폰에서 테스트해야 합니다.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('알림 권한 필요', 
      '실시간 댓글 및 중요 업데이트 알림을 받으시려면 설정에서 알림 권한을 허용해 주세요.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  }

  const onMessageFromWeb = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if(message.type === 'LOGOUT') {
        await CookieManager.clearAll(true);

        webViewRef.current?.reload();

        return;
      }

      if (message.type === 'REQUEST_PUSH_TOKEN') {
        const realToken = await getRealPushToken();

        if (realToken && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'RESPONSE_PUSH_TOKEN',
            token: realToken
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${process.env.EXPO_PUBLIC_SERVER_DOMAIN}` }} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={false}
        onMessage={onMessageFromWeb}
        originWhitelist={['https://*', 'http://*', 'kauth.kakao.com', 'kakaolink://*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});