
module.exports = {
  preset: '@react-native/jest-preset',

  // La primera corrida (sin la caché de Jest) compila todos los módulos de React Native y
  // React Navigation, y varios tests pasan los 5 s por defecto. Con la caché tibia tardan
  // milisegundos; el límite solo evita falsos fallos en una máquina que acaba de clonar el repo.
  testTimeout: 30000,

  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation)/)',
  ],
};
