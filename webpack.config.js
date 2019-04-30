var webpack = require('webpack');
var path = require('path');
var libraryName = 'dist';
var outputFile = libraryName + '.js';

var config = {
  entry: __dirname + '/index.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  }
};

module.exports = config;

// module.exports = {
//   mode: 'development',
//   entry: './index.js',
//   output: {
//     filename: 'index.bundle.js'
//   }
// };