const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  target: 'web',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    assetModuleFilename: '[name][ext]',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\*.*/,
        exclude: path.resolve(__dirname, "node_modules"),
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp3|gltf)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(woff|woff2)$/,
        use: {
          loader: 'url-loader',
        },
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'My21Sats',
      filename: 'index.html',
      template: 'src/template.html'
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    })
  ],
  resolve: {
    fallback: {
      "path": false,
      "fs": false,
      "stream": false,
      "async_hooks": false,
      "http": false,
      "net": false,
      "crypto": false,
      "zlib": false
    }
  }
}