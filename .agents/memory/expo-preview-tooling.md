---
name: Expo preview tooling
description: Environment-specific behavior when running Expo previews in this workspace.
---

The Expo preview may report that React Native DevTools could not install because the container lacks `libglib-2.0.so.0`; this is non-blocking when Metro continues, exposes the QR/web URLs, and the app renders.

**Why:** The warning is emitted by an optional development tool, not by the app bundle. Treating it as an app failure would lead to unnecessary dependency changes.

**How to apply:** Confirm the Expo workflow stays running and the preview renders before investigating this warning.