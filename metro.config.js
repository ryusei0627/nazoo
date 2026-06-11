// Expoデフォルト設定を拡張し、Rive(.riv)をアセットとして扱えるようにする
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('riv');

module.exports = config;
