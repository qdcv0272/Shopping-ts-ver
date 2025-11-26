const path = require("path"); // Node 경로 유틸리티
const HtmlWebpackPlugin = require("html-webpack-plugin"); // HTML 템플릿 자동 생성

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: "./src/index.ts", // 번들 시작점
  output: {
    path: path.resolve(__dirname, "dist"), // 결과물을 둘 폴더
    filename: "bundle.js", // 생성될 JS 파일 이름
    clean: true, // 빌드 전에 dist 정리
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"], // import 시 확장자 생략 허용
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader", // TS → JS 변환
        exclude: /node_modules/, // 라이브러리 제외
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"], // CSS를 JS에 포함 후 style 태그로 삽입
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf)$/i,
        type: "asset/resource", // 정적 자산을 파일로 출력
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"), // 사용할 HTML 템플릿
      inject: "body", // 번들을 body 끝에 삽입
    }),
  ],
  devtool: "source-map", // 디버깅용 소스맵 생성
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"), // 정적 파일 제공 폴더
    },
    historyApiFallback: true, // SPA 라우팅 지원
    port: 5173, // 개발 서버 포트
    open: true, // 서버 시작 시 브라우저 자동 오픈
    hot: true, // HMR 활성화
  },
};
