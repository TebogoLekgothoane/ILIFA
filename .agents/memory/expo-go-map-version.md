---
name: Expo Go map compatibility
description: Release-target decision for react-native-maps under Expo SDK 57
---

For the current PASTPORT release target, Expo Go compatibility takes priority over Expo SDK 57’s generic `react-native-maps` recommendation. Keep `react-native-maps` pinned to `1.18.0` and exclude it from Expo dependency validation with `expo.install.exclude` until the release target changes to a custom native build.

**Why:** Expo SDK 57’s validator reports `1.27.2`, but the Expo Go-compatible map version is `1.18.0`; accepting the validator upgrade can make the Expo Go preview crash.

**How to apply:** If the release target remains Expo Go, preserve both the exact pin and the validator exclusion. If the target changes to a native build, remove the exclusion only after validating the native map implementation with the SDK-supported version.