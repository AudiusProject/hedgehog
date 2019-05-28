'use strict'

const path = require('path')

var config = {
  target: 'web',
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  entry: [
    './index.js'
  ],
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

module.exports = config
