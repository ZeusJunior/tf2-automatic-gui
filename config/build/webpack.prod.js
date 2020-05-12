const path = require("path");
const common = require("./webpack.config");
const merge = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
var HtmlWebpackPlugin = require("html-webpack-plugin");
const pages = require('../scripts/pages');

module.exports = merge(common, {
  devtool: false,
  mode: "production",
  output: {
    filename: "[name]-[contentHash].bundle.js",
    publicPath: '/',
    path: path.resolve(__dirname, "../../dist/assets")
  },
  optimization: {
    minimizer: [
      new OptimizeCssAssetsPlugin(),
      new TerserPlugin(),
      ...pages().map(page => new HtmlWebpackPlugin({
        template: page.dir + page.name + '.html',
        filename: '../html/' + page.name + '.html',
        chunks: [page.name],
        minify: {
          removeAttributeQuotes: true,
          collapseWhitespace: true,
          removeComments: true
        }
      }))
    ],
    splitChunks: {
      // include all types of chunks
      chunks: 'all'
    },
    usedExports: true
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].[contentHash].css" }),
    new CleanWebpackPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader, //3. Extract css into files
          "css-loader", //2. Turns css into commonjs
          "sass-loader" //1. Turns sass into css
        ]
      }
    ]
  }
});
