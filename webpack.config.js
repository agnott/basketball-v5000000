const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const PATHS = {
  INPUT: `${__dirname}/client`,
  OUTPUT: `${__dirname}/build`
};

module.exports = (env) => {
  return {
    entry: [`${PATHS.INPUT}/index.js`],
    output: {
      path: PATHS.OUTPUT,
      filename: 'bundle.js',
    },
    plugins: [
      new CopyWebpackPlugin([{
        from: `${PATHS.INPUT}/index.html`,
        to: PATHS.OUTPUT
      }]),
      new webpack.EnvironmentPlugin({
        'API_ENDPOINT': 'http://localhost:3000',
      })
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['@babel/preset-env'],
            plugins: [require('@babel/plugin-proposal-object-rest-spread')]
          }
        }
      ]
    },
    devServer: {
      contentBase: 'build'
    },
    watchOptions: {
      poll: 500
    }
  };
};
