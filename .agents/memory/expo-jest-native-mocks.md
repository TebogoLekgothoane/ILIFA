---
name: Expo Jest native mocks
description: A Jest module-mocking constraint that affects Expo native-module tests.
---

When mocking Expo native modules in Jest, return wrapper functions that delegate to the test mock instead of assigning a test mock function directly in the hoisted factory.

**Why:** Jest evaluates `jest.mock` factories before test-scope initialization. A direct function reference can be captured as `undefined`, while a closure resolves the initialized mock when the component calls it.

**How to apply:** Use a factory export such as `getCurrentPositionAsync: (...args) => mockGetCurrentPositionAsync(...args)` for functions whose calls need assertions.