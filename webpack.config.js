const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require("brotli-webpack-plugin");

module.exports = {
  entry: {
    index: [
      path.resolve(__dirname, "src", "client", "index.js"), 
      path.resolve(__dirname, "src", "client", "index.scss")
    ],
    kbm: [
      path.resolve(__dirname, "src", "client", "kbm.js"), 
      path.resolve(__dirname, "src", "client", "kbm.scss")
    ]
  },
  output: {
    path: path.resolve(__dirname, "public", "js"),
    filename: "[name].bundle.js",
    chunkFilename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(ttf|eot|svg|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader",
        options: {
          sourceMap: true,
          outputPath: "../fonts",
          publicPath: "../fonts"
        }
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-proposal-object-rest-spread"]
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              outputPath: "../css",
              publicPath: "../css",
              sourceMap: true
            }
          },
          {
            loader: "css-loader" // translates CSS into CommonJS
          },
          {
            loader: "postcss-loader", // Run post css actions
            options: {
              plugins: function() {
                return [require("precss"), require("autoprefixer")];
              }
            }
          },
          {
            loader: "sass-loader", // compiles Sass to CSS
            options: {
              sourceMap: true,
              implementation: require("sass")
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "../css/[name].style.css",
      chunkFilename: "[hash].css"
    }),
    new CompressionPlugin({
      filename: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.(js|css|html)$/,
      threshold: 10240,
      minRatio: 0.7
     }),
    new BrotliPlugin({
      asset: "[path].br[query]",
      test: /\.(js|css|html)$/,
      threshold: 10240,
      minRatio: 0.7
    })
  ],
  optimization: {
    minimizer: [
      new OptimizeCssAssetsPlugin({
        cssProcessor: require("cssnano"),
        cssProcessorPluginOptions: {
          preset: ["default", { discardComments: { removeAll: true } }]
        },
        canPrint: true
      }),
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
        terserOptions: {
          output: {
            comments: false
          }
        },
        extractComments: false
      })
    ]
  },
  resolve: {
    extensions: [".json", ".js", ".css", ".scss"]
  },
  devServer: {
    contentBase: path.join(__dirname, "public"),
    compress: true,
    writeToDisk: true,
    host: "::",
    port: 80,
    liveReload: true,
    watchContentBase: true
  },
  devtool: "source-map"
};
