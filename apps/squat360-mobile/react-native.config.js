/**
 * Fold7-safe preview: set EXPO_NO_MEDIAPIPE=1 to skip ThinkSys MediaPipe native
 * autolinking (avoids splash-crash on Android 16). Development / pose profiles
 * omit the env var to keep live landmarks.
 */
const disableMediapipe = process.env.EXPO_NO_MEDIAPIPE === '1';

module.exports = {
  dependencies: disableMediapipe
    ? {
        '@thinksys/react-native-mediapipe': {
          platforms: { android: null, ios: null },
        },
      }
    : {},
};
