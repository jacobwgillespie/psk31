const path = require('path');
const HappyPack = require('happypack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const rootPath = __dirname;
const outputPath = path.join(rootPath, 'dist');

const config = {
  entry: {
    app: 'src/app.js',
  },

  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: ['node_modules'],
    root: rootPath,
  },

  output: {
    path: outputPath,
    filename: '[name].js',
    publicPath: '/',
  },

  debug: true,
  devtool: 'cheap-module-eval-source-map',

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
        happy: { id: 'js' },
      },
    ],
  },

  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new HappyPack({ id: 'js' }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin(),
  ],
};

module.exports = config;
