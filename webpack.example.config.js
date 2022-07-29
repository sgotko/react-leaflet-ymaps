const path = require("path");

module.exports = {
    entry: "./examples/index.jsx",
    mode: "development",
    output: {
        path: path.resolve(__dirname, "examples"),
        filename: "build.js",
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
        ],
    },
};
