const path = require("path");
const common = require("./webpack.config");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const pages = require('../scripts/pages');

module.exports = merge(common, {
  mode: "development",
  devtool: 'source-map',
  output: {
    filename: "[name]-bundle.js",
    publicPath: '/',
    path: path.resolve(__dirname, "../../dist/assets")
  },
  plugins: [
    ...pages().map(page => new HtmlWebpackPlugin({
      template: page.dir + page.name + '.html',
      filename: path.resolve(__dirname, "../../dist/html", page.name + '.html',),
      chunks: [page.name]
    })),
    new CleanWebpackPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ]
      }
    ]
  }
});
