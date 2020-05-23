const pages = require('../scripts/pages');
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const path = require('path');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
	entry: {
		...pages().reduce((object, item)=>{
			if(!path.isAbsolute(item.dir)) {
				item.dir = path.resolve(item.dir);
			}
			object[item.name] = path.join(item.dir, item.name+'.js')
			return object;
		}, {})
	},
	module: {
	  rules: [
		{
			test: /\.(svg|png|jpg|gif)$/,
			use: {
				loader: "file-loader",
				options: {
					name: "[name].[hash].[ext]",
					outputPath: "imgs"
				}
			}
		},
		{
			test: /\.m?js$/,
			exclude: file => (
				/node_modules/.test(file) &&
				!/\.vue\.js/.test(file)
			),
			use: {
				loader: 'babel-loader',
				options: {
					presets: [
						'@babel/env'
					],
					plugins: [
						'@babel/plugin-transform-runtime',
						"transform-regenerator",
					]
				}
			}
		},
		{
			test: /\.vue$/,
			loader: 'vue-loader'
		}
	  ]
	},
	plugins: [
		new VueLoaderPlugin(),
		new MomentLocalesPlugin({
            localesToKeep: ['en'],
        }),
	]
  };
  