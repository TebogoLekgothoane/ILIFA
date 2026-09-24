const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// GLB files are binary assets and must be handled by Metro as assets rather than source.
config.resolver.assetExts = [...config.resolver.assetExts, 'glb'];

module.exports = config;
