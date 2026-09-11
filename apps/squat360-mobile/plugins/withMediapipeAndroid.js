/**
 * Expo config plugin: Android bits for @thinksys/react-native-mediapipe
 * (camera feature + CAMERA permission). No Apple frameworks.
 */
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

function ensureChild(parent, tag, attrs) {
  if (!parent) return;
  parent[tag] = parent[tag] || [];
  const exists = parent[tag].some((node) =>
    Object.entries(attrs).every(([k, v]) => node.$?.[k] === v)
  );
  if (!exists) {
    parent[tag].push({ $: attrs });
  }
}

function withMediapipeAndroid(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    if (!manifest) return mod;

    ensureChild(manifest, 'uses-feature', {
      'android:name': 'android.hardware.camera',
      'android:required': 'false',
    });
    ensureChild(manifest, 'uses-permission', {
      'android:name': 'android.permission.CAMERA',
    });
    ensureChild(manifest, 'uses-permission', {
      'android:name': 'android.permission.RECORD_AUDIO',
    });

    AndroidConfig.Permissions.ensurePermissions(mod.modResults, [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ]);

    return mod;
  });
}

module.exports = withMediapipeAndroid;
