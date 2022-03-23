const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function override(config, env) {
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, './node_modules/libpag/lib/libpag.wasm'), to: './static/js/' }],
    }),
  );

  return config;
};
