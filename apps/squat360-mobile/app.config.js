const appJson = require('./app.json');

module.exports = ({ config }) => {
  const expo = { ...(appJson.expo || config) };
  const disableMediapipe = process.env.EXPO_NO_MEDIAPIPE === '1';
  if (disableMediapipe && Array.isArray(expo.plugins)) {
    expo.plugins = expo.plugins.filter((p) => {
      const name = Array.isArray(p) ? p[0] : p;
      return name !== './plugins/withMediapipeAndroid';
    });
  }
  expo.extra = {
    ...(expo.extra || {}),
    disableNativeMediapipe: disableMediapipe,
    comfyuiBaseUrl:
      process.env.EXPO_PUBLIC_COMFYUI_URL || expo.extra?.comfyuiBaseUrl || '',
  };
  return { expo };
};
