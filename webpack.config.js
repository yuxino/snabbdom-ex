const HtmlWebpackPlugin = require('html-webpack-plugin') 
const path = require('path')

module.exports = {
  mode: 'development',
  entry: './debugger/index.js',
  devtool: 'inline-source-map',
  output: {
      path: __dirname + '/dist',
      filename: 'index_debugger_bundle.js'
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      src: path.resolve(__dirname, 'src'),
    }
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [new HtmlWebpackPlugin({
      template: './debugger/index.html'
  })]
}