# github-api-file-upload とは?

Github APIを使用してGithubのリポジトリにファイルをアップロードできるかどうか試してみるプロジェクト

# サンプル

以下のコマンドを実行するとファイルがリポジトリにアップロードされる

```
yarn run ts-node src/upload.ts
```

# 仕様

* アップロードするファイルは `ArrayBuffer` から `Base64` に変換する必要がある(以下のように)

```typescript
Buffer.from(content).toString('base64'),
```

* 既存のファイルを更新する場合には更新先のファイルの`SHA` の値を指定する必要がある
  * 既存のファイルの `SHA` の値の取得は [getContent API](https://octokit.github.io/rest.js/v19#repos-get-content) を実行することで取得することができる([getContent API](https://octokit.github.io/rest.js/v19#repos-get-content) を実行してファイルがなかった場合は `404` が返ってくるのでうまく拾う必要がある)


# 参考

* [Create or update file contents](https://octokit.github.io/rest.js/v19#repos-create-or-update-file-contents)
* [How do I get the "sha" parameter from GitHub API without downloading the whole file?](https://stackoverflow.com/questions/26203603/how-do-i-get-the-sha-parameter-from-github-api-without-downloading-the-whole-f)
* [How to find a Github file 's SHA blob](https://stackoverflow.com/questions/20207594/how-to-find-a-github-file-s-sha-blob)