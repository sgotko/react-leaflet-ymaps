const path = require('path')

module.exports = {
	entry: path.resolve(__dirname, "examples/index.jsx"),
	mode: "development",
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "app.js",
		clean: true
	},
	module: {
		rules: [
			{
				test: /\.(jsx|js)$/,
				include: path.resolve(__dirname, "examples"),
				exclude: /node_modules/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								[
									"@babel/preset-env",
									{
										targets: "defaults",
									},
								],
								"@babel/preset-react",
							],
						},
					},
				],
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	devServer: {
		hot: true,
		static: {
			directory: path.join(__dirname, 'public'),
		},
	},
};
