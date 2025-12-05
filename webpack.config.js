// 경로/플러그인 불러오기
const path = require("path"); // 경로 조작할 때 사용
const HtmlWebpackPlugin = require("html-webpack-plugin"); // HTML 파일을 자동으로 만들어 줌
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // CSS를 별도 파일로 추출

// 빌드할 HTML 목록 (어떤 HTML을 만들지 여기서 정의)
const htmlPages = [
  { filename: "index.html", template: "public/index.html" }, // 메인 페이지 템플릿
  { filename: "page/info.html", template: "public/page/info.html" }, // 내정보 페이지 템플릿
  { filename: "page/favorites.html", template: "public/page/favorites.html" }, // 즐겨찾기
  { filename: "page/cart.html", template: "public/page/cart.html" }, // 장바구니
  // { filename: "page/signup.html", template: "public/page/signup.html" }, // 회원가입
  { filename: "page/bootstrap.html", template: "public/page/bootstrap.html" }, // 부트스트랩
];

/** @type {import('webpack').Configuration} */

// 진입점(여기서부터 번들링 시작)
const entries = {
  index: "./src/ts/index.ts", // 프로젝트의 메인 진입점 파일 (moved into src/ts)
};

module.exports = {
  // webpack이 빌드를 시작할 파일(들)
  entry: entries,
  output: {
    path: path.resolve(__dirname, "dist"), // 빌드 결과물을 저장할 폴더

    filename: "js/[name].bundle.js", // 결과 JS 파일 이름 규칙 ([name]은 entry 이름)
    assetModuleFilename: "assets/[name][ext]", // 정적 파일(이미지, 폰트) 출력 규칙
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"], // import 할 때 확장자 순서로 해석
  },
  // 소스 파일을 어떤 로더로 처리할지 규칙을 적어놓는 곳
  module: {
    rules: [
      {
        test: /\.tsx?$/, // .ts, .tsx 파일을 찾음
        loader: "ts-loader", // TypeScript를 JS로 바꿔줌
        exclude: /node_modules/, // node_modules는 변환 대상 아님
      },
      {
        test: /\.css$/i, // .css 파일을 찾음
        use: [MiniCssExtractPlugin.loader, "css-loader"], // CSS를 추출하고 로드
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf)$/i, // 이미지/폰트 매칭
        type: "asset/resource", // 파일로 복사해서 출력
      },
    ],
  },
  // 빌드에 추가 기능을 제공하는 플러그인 목록
  plugins: [
    ...htmlPages.map(({ filename, template }) => {
      // HTML 파일 이름에서 페이지 키를 추출 (index.html -> index)
      const chunkName =
        filename === "index.html"
          ? "index"
          : filename
              .split("/")
              .pop()
              .replace(/\.html$/, "");

      // 단일 번들 구성이라 모든 HTML에 index 번들을 넣음
      const chunks = ["index"];

      return new HtmlWebpackPlugin({
        filename,
        template: path.resolve(__dirname, template), // 사용할 HTML 템플릿 파일 경로
        inject: "body", // 생성된 스크립트를 body 끝에 넣음
        chunks, // 이 HTML에 주입할 번들 목록
      });
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].css", // [name]에 맞는 css 파일로 추출
    }),
  ],
  // 개발 중 원본 코드를 쉽게 추적할 수 있게 소스맵 생성
  devtool: "source-map",

  // 최적화 옵션: 이번에는 한 파일로 묶기 때문에 코드 분할 비활성화
  optimization: {
    splitChunks: false, // 여러 청크로 분리하지 않음
    runtimeChunk: false, // 런타임 코드 별도 분리하지 않음
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"), // 개발 서버가 제공할 정적 파일 위치
    },
    historyApiFallback: true, // SPA 라우팅 대응 (404를 index.html로 포워딩)
    port: 3002, // 개발 서버 포트
    open: true, // 서버 시작 시 브라우저 자동 오픈
    hot: true, // 변경사항을 페이지에 바로 반영(HMR)
  },
};
