var webpack = require("webpack");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var path = require('path');

module.exports = {
  entry: {
    test:'./test/connectfour.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.(js|jsx|es6)$/, exclude: /node_modules/, loader: "babel-loader"},
      { test: /\.scss$/i, loader: ExtractTextPlugin.extract(["css", "sass"])},
      { test: /\.json$/i, loader: "json-loader"},
      { test: /\.sol/, loader: 'truffle-solidity' }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './app/index.html', to: "index.html" },
      { from: './app/images', to: "images" },
      { from: './app/fonts', to: "fonts" }
    ]),
    new ExtractTextPlugin("app.css")
  ],
  devServer: {
    stats: 'errors-only',
  }
};
