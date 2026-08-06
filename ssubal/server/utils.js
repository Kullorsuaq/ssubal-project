const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const expo = new Expo();

const sendPushNotification = async (pushTokens, title, body, data = {}) => {
  if(!pushTokens || pushTokens.length === 0) {
    return;
  }

  const messages = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data
    }));

  if(messages.length === 0) return;

  //Expo 서버로 한 번에 전송
  const chunks = expo.chunkPushNotifications(messages);

  for(let chunk of chunks) {
    try {
      console.log(await expo.sendPushNotificationsAsync(chunk));
    } catch(error) {
      console.error('푸시 알림 전송 에러', error);
    }
  }
}

module.exports = { sendPushNotification };