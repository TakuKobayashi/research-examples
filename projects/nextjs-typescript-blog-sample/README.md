# nextjs-typescript-blog-sample

nextjsでmarkdownで記述できるblogサイトを作ってみるためのサンプルプロジェクト

ファイル名に `[変数名].tsx` をと言うような名前にするとダイナミックルーティング(可変的なURLパスを設定できるようになる仕組み)を実装することができる。(NextJS側の仕様)

URLは `/post/${post.slug}` と言った感じにプロジェクトルートにmarkdownファイルを置いた場所を変数として取得できるのでその場所のファイルを読み込む

### 参考

* [Next.jsを利用した初めての本格的Markdownブログサイトの構築](https://reffect.co.jp/react/nextjs-markdown-blog)