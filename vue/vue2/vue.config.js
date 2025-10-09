const path = require('path');
const config = require('./config');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  configureWebpack: {
    entry: { app: './src/main.js' },
    output: {
      path: config.build.assetsRoot,
      filename: '[name].js',
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, './node_modules/libpag/lib/libpag.wasm'),
            to:   config.build.assetsPublicPath,
          },
        ],
      }),
    ],
  },
  optimizeDeps: {
    exclude: ['libpag']
  },
  assetsInclude: ['**/*.wasm'],
};