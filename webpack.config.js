'use strict'

const path = require('path')

const clientConfig = {
  target: 'web',
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: ['./index.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'browser.js',
    // library: 'Hedgehog',
    libraryTarget: 'window'
  },
  module: {
    rules: [
      {
        test: /.jsm$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
}

const serverConfig = {
  target: 'node',
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: ['./index.js'],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'hedgehog.js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /.jsm$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
}

module.exports = [clientConfig, serverConfig]
