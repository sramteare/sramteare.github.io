const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    mode : "development",
    entry: ['./src/js/init.js'],
    output: {
      path:path.resolve(__dirname, '/public'),
      filename: "bundle.js"
    },
    devServer : {
        contentBase: path.join(__dirname, './src'),
        watchContentBase: true,
        compress: true,
        port: 9000,
        hot: true
    }
}