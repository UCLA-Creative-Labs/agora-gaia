const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = merge(common, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].min.js'
    },
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            }
        ]
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].min.css',
            chunkFilename: '[id].[contenthash].min.css'
        })
    ]
});