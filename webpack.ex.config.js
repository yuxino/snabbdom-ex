const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./ex/index.ts",
  devtool: "inline-source-map",
  output: {
    path: __dirname + "/ex-dist",
    filename: "index_debugger_bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      src: path.resolve(__dirname, "src")
    }
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./ex/index.html"
    })
  ]
};
