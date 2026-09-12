# Hardware stubs (optional)

Future optional capture path: **Sony IMX500** (or similar) intelligent vision sensors for edge ROI / sparse events.

- Not required for the Samsung Galaxy MediaPipe default path.
- Keep phone-camera Record/Review working without external hardware.
- When integrating: document cabling, power, and sync with `sessions` rows in sqlite.

Placeholder modules can live here (`imx500Client.ts`, etc.) without blocking Expo Go demos.

On-device pose on Galaxy uses MediaPipe in the Expo **dev client** (`npx expo run:android`), not this hardware path.
