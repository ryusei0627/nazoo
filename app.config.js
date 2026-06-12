// app.json をベースに、デプロイ時のみ baseUrl を付与する。
// ローカル開発（expo start）は env 未設定なので root('/') のまま動く。
// 例: NAZOO_BASE_URL=/nazoo npx expo export -p web
const appJson = require('./app.json');

module.exports = () => {
  const expo = { ...appJson.expo };
  expo.plugins = Array.from(new Set([...(expo.plugins || []), 'expo-sharing']));
  const base = process.env.NAZOO_BASE_URL;
  if (base) {
    expo.experiments = { ...(expo.experiments || {}), baseUrl: base };
  }
  return { expo };
};
