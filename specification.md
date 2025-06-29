了解しました。Cursolを用いて、このローカルLLM分析システム全体をAI駆動で開発可能な仕様書に落とし込む方法を詳しく調査します。

調査では、Cursol上での仕様書の構成方法、AIエージェントによる自動アプリ生成の設計指針、Dockerベースでの開発支援との整合性などを明確化し、実装まで想定した構成に仕上げます。

少々お待ちください。完了次第ご案内します。


# ローカルLLM分析システム – AI自動開発対応仕様書

## 概要 (システム概要)

本ドキュメントは、営業活動記録のExcelデータをローカル環境で分析するWebアプリケーションの**構造化された仕様書**です。AIコード補助ツール「Cursor（カーソル）」に本仕様書を読み込ませることで、アプリの画面・機能・データ構造・AI連携など**全体を自動生成**できるレベルの詳細設計を記述しています。本システムの主な特徴および要件は以下の通りです。

* **ローカル環境 / Dockerデプロイ:** システムはDockerコンテナ上で動作し、インターネットに依存しません。LLM（大規模言語モデル）はローカルで稼働するOllamaを使用し、機密データも外部送信されません。
* **Excel営業データのアップロードと分析:** ユーザは営業活動の履歴を記録したExcelファイルをアップロードできます。アップロードされたデータに対し、AIが分析を行い、KPI計測やトレンド抽出などの結果を生成します。
* **プロンプトによる柔軟な分析指示:** ユーザはテキストプロンプトで分析内容を指示できます。どのKPIに着目するか、個人名などの機微情報を匿名化するか、出力フォーマット（例: 箇条書き、グラフ形式など）をどうするか等、**すべてプロンプト経由で制御**可能です。例えば「**月別の平均売上を棒グラフで表示して**」と指示すれば、AIが自動的にコードを生成しグラフ描画まで行うことも可能です。
* **分析結果のテキスト＆グラフ表示:** AIによる分析結果は**テキストレポート**および**グラフ**として可視化されます。数値サマリや洞察は文章で提示され、主要KPIは棒グラフや折れ線グラフ等で視覚的に表示されます。
* **結果データの保存と履歴管理:** 分析結果は履歴として保存でき、ユーザは過去の分析結果を一覧で閲覧できます。保存された各分析結果は再度開いて確認したり、**ダウンロード**（例: PDFレポートや画像）したり、不要になれば**削除**することも可能です。
* **LLMモデル:** 分析にはローカルLLMエンジン「Ollama (オラマ)」を使用します。Ollama上で適切な日本語対応モデル（例: Llamaベースの**llama3**モデル等）を動作させ、チャット形式でデータ分析を行います。モデル実行はすべてローカルマシン内で完結し、ネットワークを介しません。

以上の要件を踏まえ、以下に各画面の設計、機能詳細、データベース設計、プロンプト設計、AIエージェント構成、Docker構成について順に詳述します。本仕様は**Markdown形式**で構造化されており、Cursorのドキュメント駆動開発（DocDD）でそのまま利用できる粒度・形式になっています。

## システム構成とインフラ (アーキテクチャ & Docker)

本システムはクライアントサイドとサーバサイドを含むWebアプリケーションであり、**Dockerコンテナ**によってホストされます。主要コンポーネントとアーキテクチャは以下の通りです。

* **フロントエンド:** ユーザインタフェース部分。React/Next.jsなどのフレームワークを用いて実装します（技術スタックは例示であり、実際にはCursorが自動選択する技術を許容）。画面描画・ファイルアップロード・チャート表示などを担当します。
* **バックエンド:** 分析処理の制御およびAPI提供部分。Node.js（Next.js API Routes）もしくはPythonの軽量サーバ（FastAPI等）で実装し、アップロードされたExcelデータの受け渡し、LLMへのプロンプト送信、データベースとのやりとりを行います。
* **LLMエンジン (Ollama):** ローカルで動作するLLMサーバ。Docker上でOllamaコンテナを起動し、必要なモデルを読み込んで待機します。バックエンドはHTTPまたはCLI経由でこのLLMにプロンプトを送り、生成された分析結果を受け取ります。Ollamaは`docker run`コマンド一発で起動可能で、ポート`11434`を介してモデルの推論サービスを提供します。
* **データベース:** ローカルなRDB（SQLiteなど）を利用します。分析結果の履歴やメタデータ（ファイル名や日時など）を保存するために用います。Dockerコンテナ内部に組み込み、永続化Volumeを設定することでコンテナ再起動後もデータが保たれるようにします。
* **コンテナ構成:** Docker Composeを用いて上記コンポーネントを統合します。例えば、`docker-compose.yml`内で以下のサービスを定義します。

  * `web`: フロントエンド+バックエンドアプリケーション用コンテナ。ポート（例: 3000番）をホストに公開。
  * `ollama`: LLMエンジン用コンテナ。Ollama公式イメージ`ollama/ollama`を使用し、ポート11434をホストおよび`web`コンテナに向け公開。モデルデータ用にVolumeマウント（例: `ollama:/root/.ollama`）し、任意のモデル（例: `ollama pull llama2:7b`等）を事前取得しておく。
  * 上記2コンテナは同一ネットワーク上にあり、`web`コンテナから`http://ollama:11434`等でLLMにアクセスできます。
* **セキュリティとプライバシー:** 本システムは完全ローカル動作であり、アップロードされた営業データや分析結果が外部に送信されることはありません（Ollamaもローカル内で完結）。Docker環境上でネットワークアクセスを制限し、UI上にもその旨（「データはローカル内で安全に処理されます」等）を表示します。KPIに個人名が含まれる場合などは、必要に応じユーザがプロンプトで匿名化指示を出せるよう設計しています（後述のプロンプト入力設計参照）。

※インフラ設定に関する設計方針はCursorで扱えるよう記述しています。CursorによりDocker関連ファイル（Dockerfileやdocker-compose.yml）も自動生成されることを想定し、上記のようにサービス名・ポート番号・使用イメージ等の情報を明示しています。

## 機能要件一覧 (機能の整理)

本節では、本システムに必要な主要機能を箇条書きで整理します。各機能の詳細は後続の画面設計やデータ設計にて具体化しますが、まずは全体像を把握するため一覧します。

1. **Excelデータアップロード機能:** ユーザがローカルのExcelファイル（営業活動記録）を選択・アップロードできる。対応ファイル形式は`.xlsx`（必要に応じて`.csv`も）。
2. **プロンプト入力・分析指示機能:** ユーザが自由記述のテキストプロンプトで分析内容を指示可能。KPI項目の指定、期間や条件の絞り込み、実名の伏せ字化、出力形式（例: 「箇条書きで」「グラフのみで表示して」等）の指定を行える。
3. **LLM分析実行機能:** バックエンドでLLM（Ollama）にプロンプトとデータを渡し、分析を実行。AIは受け取った営業データに対して統計集計や重要ポイント抽出を行い、日本語で結果を生成する。
4. **テキスト結果表示機能:** AIから返された分析結果テキストを画面上に表示。重要な数値や洞察を含む文章を段落・箇条書き等指定フォーマットでレンダリングする。
5. **グラフ可視化機能:** AIの分析内容に応じてグラフを描画表示。例えば「月別売上推移」を分析した場合は月別の折れ線グラフを、地域比較なら地域別棒グラフを表示する。グラフ描画にはChart.jsなどのライブラリを利用。
6. **分析結果保存機能:** ユーザが分析結果を後で参照できるよう、結果データを保存する。保存時にはメタ情報（分析日時、使用したファイル名、ユーザ入力プロンプト内容の要約など）も記録する。
7. **分析履歴閲覧・管理機能:** 過去に保存した分析結果の一覧を画面上で確認できる。各エントリを選択すると詳細（テキスト＋グラフ）を再表示可能。不要なエントリは削除できる。
8. **結果ダウンロード機能:** 分析結果を外部ファイルとしてエクスポート可能。例として、テキストレポートとグラフ画像を組み合わせたPDFレポートをダウンロードさせる。あるいはテキストはMarkdown/HTML、グラフはPNG画像でエクスポートするオプションも検討。
9. **エラーハンドリング機能:** ファイル形式不備時のエラー通知、AI分析失敗時の再試行やタイムアウト処理、プロンプト不備時の警告表示などを行う。ユーザに明確なエラーメッセージを提示し、次の行動を案内する。

以上が本システムの主要機能です。次章以降で、画面ごとにレイアウト・詳細要件を示し、これら機能をどのように実現するかを具体化します。

## 画面設計 (UI画面ごとの仕様)

本システムにおける画面は主に\*\*「分析画面」**と**「履歴画面」\*\*の2種類です。分析画面ではデータアップロードと分析結果の表示を行い、履歴画面では過去の分析結果一覧の閲覧・管理を行います。各画面の設計を以下に示します（画面ごとに概要、レイアウト、機能、UI要件、エラー処理等を明記）。なお、レスポンシブ対応についても触れ、必要に応じてPCとモバイルでの表示差異を記載します。

### 分析画面 (データアップロード & 分析結果表示)

**■ 概要:** ユーザがExcelデータをアップロードし、プロンプトを入力してAI分析を実行、その結果（テキスト＋グラフ）を閲覧・保存するためのメイン画面です。アプリ起動時に表示されるホーム画面的役割も兼ねます。

**■ 画面構成:**

* **アップロードエリア:** 画面上部にファイル選択ボタンまたはドラッグ&ドロップエリアを配置します。ユーザがExcelファイルをここに指定するとアップロードがトリガーされます。ファイル選択後、即座に読み込みせず一旦待機状態とし、後述の「分析開始ボタン」クリックで送信される想定です。
* **プロンプト入力フィールド:** アップロードエリアに続いてテキスト入力欄（複数行対応のテキストエリア）を配置します。プレースホルダ例：「分析の指示を入力（例：『月別の売上推移をグラフで表示し、トップセールス担当者の名前は匿名化して』）」のように、ユーザがどんな指示を書けるか分かるヒントを表示します。
* **分析開始ボタン:** アップロードファイルとプロンプトが指定された後に押下できる送信ボタンを設置します。ユーザがクリックするとバックエンドにリクエストを送り、AI分析を開始します。ボタン押下後は分析処理完了まで非活性にし、処理中インジケータ（スピナーなど）を表示します。
* **分析結果表示エリア:** 画面下部（またはページ下方）に分析結果を表示する領域を用意します。分析完了後、このエリアにテキスト結果とグラフが動的に挿入されます。初期状態では何も表示せず、分析実行後にコンテンツが現れる形とします。

  * **テキスト結果パネル:** 分析内容を文章で表示する部分。段落または箇条書き形式で、重要キーワードを強調（太字や色付け）するなど見やすく整形します。ユーザ指示に応じて出力フォーマットが変わるため、Markdown記法などをLLMが返した場合は適切にレンダリングします。
  * **グラフ表示パネル:** テキスト結果の下にグラフを描画表示する部分。グラフの種類・本数は分析内容によって可変です（KPIが複数ある場合は複数グラフを縦に並べるなど）。Chart.js等を利用し、バックエンドから渡されたデータやLLM提案内容に従って描画します。
* **結果操作ボタン:** 分析結果表示エリア内、もしくはその直上部に「保存」「ダウンロード」のボタンを配置します。

  * 「**保存**」ボタン: 現在表示中の分析結果を履歴に保存します。押下時に結果データがデータベースに書き込まれ、「保存しました」「履歴に追加しました」のような通知をユーザに表示します。
  * 「**ダウンロード**」ボタン: 現在の結果をファイルとして保存します。クリックでPDF生成をサーバに要求し、自動ダウンロードさせます（または形式選択ダイアログを出す）。
* **履歴画面へのナビゲーション:** 画面の隅（ヘッダーのメニューやサイドバー）に履歴画面への遷移リンクまたはボタンを配置します。例えば画面右上に「📂履歴」アイコンを置き、クリックで履歴一覧画面へ移動します。

**■ 機能要件:**

* **ファイルアップロード処理:** ユーザが指定したExcelファイルを受け取り、一時保存またはメモリ展開します。クライアント側で簡易チェック（拡張子やファイルサイズ）を行い、問題なければバックエンドAPI（例: `/api/upload`）に送信します。バックエンドではPythonのpandasやNodeのExcelパーサ等でデータを読み込み、後続のLLM処理で使えるフォーマット（JSONやCSV文字列）に変換します。
* **プロンプト文の組み立て:** バックエンドはユーザ入力プロンプトと、必要なら固定のシステムプロンプトを結合してLLMに送ります。システムプロンプト（内部指示）は「あなたはデータ分析アシスタントです。与えられた営業データについてユーザの指示に従い分析してください…」等のガイドラインを含みますが、**KPI選択や匿名化などは全てユーザ入力で指示できる**ため、システム側では最小限の指示（フォーマット統一や禁止事項）に留めます。
* **LLM分析実行:** バックエンドからOllamaに対し、組み立てたプロンプトと分析データを送信し、モデル推論を実行します。大量データの場合は要約や分割して逐次プロンプト投入も検討します。LLMは指示に従い、データの要点やKPIを算出します。例えば「月別売上推移」の指示なら各月の合計/平均を計算し、増減トレンドを文章化します。個人名匿名化指示があれば、結果文中で「営業担当A」等に置換します。**なお、計算処理の正確性が重要な場合、バックエンド側で数値集計を行い、その結果をプロンプトに埋め込んでAIに解説させるアプローチも考慮します。**（AI単独で計算させると誤りの可能性があるため）。
* **結果受信とパース:** LLMからの応答テキストを受信後、バックエンドはそれをフロントエンドに返します（API経由）。返答には文章およびグラフ描画用のデータ/指示が含まれます。グラフに関しては、LLMが例えば「月ごとの売上を棒グラフで表示してください。各月の売上は…」という記述やJSONフォーマットデータを返す想定です。可能であれば、LLM出力に簡易なマークアップ（例: `<chart type="bar" data="...">`のようなタグ or 「Graph: JSONデータ」など）を含めさせ、フロントがそれを検出してデータ抽出できるようにします。
* **テキスト表示:** フロントエンドは結果テキストを整形して表示します。Markdown記法が含まれる場合はパーサーでHTMLに変換します。箇条書き・表形式などユーザ指定のフォーマットに応じて適切にスタイル適用します。
* **グラフ描画:** フロントは結果内のグラフ指示に基づきチャートを描画します。例えばLLMから以下のようなJSONが返ってきた場合を想定します:

  ```json
  {"graph": {"type": "bar", "title": "月別売上", "labels": ["1月","2月",...], "values": [123, 140, ...]}}
  ```

  これを受け取ったら、Chart.jsの設定オブジェクトにマッピングして棒グラフをレンダリングします。LLMがグラフ提案をテキストで述べるだけの場合、バックエンドでキーワード解析し、該当データをサーバ側で集計して提供することも検討します（精度向上のための冗長策）。
* **保存処理:** 「保存」ボタン押下で現在の分析結果（テキスト全文、グラフデータ、関連メタ情報）をローカルDBに保存します。保存処理はバックエンドAPI（例: `/api/saveResult`）経由で行い、成功時にフロントへ確認メッセージを返します。保存の際、分析結果にタイトルを付与する場合は、デフォルトで「<日付>の分析」などとし、必要ならユーザが後で変更できるようにします。
* **ダウンロード処理:** 「ダウンロード」ボタン押下で現在の結果をファイル化します。バックエンドでHTMLテンプレート等に結果を埋め込みPDF生成ライブラリでPDF化、またはテキストと画像をZIP圧縮、といった方式で実装します。処理完了後、ファイルをレスポンスし、フロント側で自動的にダウンロードさせます。

**■ UI/UX要件:**

* **直感的なインターフェース:** ユーザが迷わず操作できるよう、手順に沿って上から下へUI要素を配置します（ファイル選択→プロンプト入力→結果表示）。分析開始ボタンは目立つ色（例: ブルー系）で配置し、無効時は淡色にすることで「まずファイルと指示を入力してください」と促すデザインにします。
* **レスポンシブ対応:** デスクトップでは上述のレイアウトで表示し、モバイルではレイアウトを縦方向に再配置します。例えば横並び要素を縦積みにし、グラフもスクロール可能な形にします。グラフは画面サイズに応じてサイズ可変にし、小さいデバイスでは横スクロールや拡大可能なUI（ピンチズーム等）を提供します。
* **ロード中インジケータ:** AI分析には数秒～数十秒の時間がかかる可能性があります。処理中はユーザに進捗を示すため、スピナーアイコンやプログレスバー、「分析実行中…」テキストを表示します。LLMから段階的な応答が得られる場合、ストリーミング表示して待ち時間のストレスを軽減します。
* **結果表示の視認性:** テキスト結果では重要数値や増減（+/-）を強調表示し、ポジティブな指標は緑、ネガティブは赤で表示するなど視覚的工夫をします。グラフには凡例や軸ラベル、単位を明示し、タイトルも表示して何のグラフか一目でわかるようにします。グラフの色使いはブランドカラーと見やすさを両立させ、色覚バリアフリーも考慮します。
* **プロンプト入力支援:** テキストエリアには文字数制限や改行可能設定を施します。必要に応じてプレースホルダで入力例を示す他、典型的な分析指示のテンプレート（ドロップダウン選択肢など）を用意することも検討します。これにより、非エンジニアユーザでも効果的な指示を書けるよう支援します。
* **通知とフィードバック:** 保存成功時やエラー発生時には、画面上部にスナックバー通知を表示します。例えば「保存しました」「分析に失敗しました。再度お試しください」といったメッセージで、ユーザに現在の状態をフィードバックします。

**■ エラーハンドリング:**

* **入力エラー:** ユーザがファイルを選択していない、もしくはプロンプトが未入力で分析開始ボタンを押そうとした場合、ボタンを無効化するとともに、その近くに「ファイルと指示を入力してください」という警告テキストを表示します。無効化に加え、ホバー時にツールチップで理由を出すなどしても良いでしょう。
* **ファイル形式エラー:** 非対応形式（例: PDFやテキストファイル）をアップロードしようとした場合、「対応していないファイル形式です。Excel (.xlsx) ファイルを選択してください。」と表示します。バックエンドでも二重チェックし、不正な内容の場合はHTTP 400エラーで詳細メッセージを返します。
* **LLM処理エラー:** モデルが何らかの理由で分析失敗・タイムアウトした場合、「分析が失敗しました。プロンプト内容を見直すか、再度実行してください。」と表示します。必要に応じて詳細ログをサーバ側に記録し、開発者が原因を追えるようにします。Cursorによる自動生成では、例外時に適切なメッセージをユーザに返すコードも含めます。
* **グラフ描画エラー:** 予期せぬフォーマットでLLM結果が返りグラフ描画に失敗した場合、グラフエリアに「グラフを表示できません（データ形式エラー）」と表示します。併せてテキスト結果は問題なく表示させ、グラフなしでも情報が伝わるようにフォローします。
* **パフォーマンス/メモリ注意:** 非常に大きなExcel（数万行以上）の場合、処理がメモリ上限を超える恐れがあります。その場合は「データ量が多すぎます。一度に分析できるデータ量は●●件までです。」といったエラーを表示し、処理を中断します。

**■ パフォーマンス要件:**

* **分析処理時間:** 小～中規模のExcel（数千行程度）なら数秒～十数秒で結果を返すことを目標とします。LLMモデルは精度と速度のバランスを考慮し、必要に応じ8-bit量子化版モデルを使用するなどして応答時間短縮を図ります。
* **非同期処理:** バックエンドの分析処理は非同期で行い、フロント側はポーリングまたはWebSocket等で進捗・完了を検知する実装とします。これによりUIがフリーズせず、複数ユーザ（将来的拡張として）同時利用時もスケーラブルにさばけます。
* **キャッシュ:** 同じファイルに対して同様のプロンプトで再分析要求があった場合、前回結果をキャッシュから即座に返す仕組みも検討します。ただし営業データは日々更新される可能性が高く、キャッシュの有効性期間を慎重に設定する必要があります。

### 履歴画面 (分析結果履歴一覧)

**■ 概要:** ユーザがこれまでに保存した分析結果を一覧表示し、再確認・管理するための画面です。分析画面から遷移でき、過去の様々な分析結果にアクセスするハブとなります。

**■ 画面構成:**

* **履歴一覧リスト:** 保存済みの各分析結果をカードまたはテーブル形式で一覧表示します。各行/カードには主要な情報（分析日時、当時の分析内容の概要やタイトル、ファイル名など）を掲載し、視覚的に一目で内容を把握できるようにします。

  * **項目例:** 「日時」「分析タイトル/概要」「使用データセット（ファイル名）」「操作」。
  * 日時は「2025-06-17 12:00」のように表示。タイトル/概要はユーザが入力したプロンプトの先頭部分や分析対象KPIを要約したもの。ファイル名はアップロードされたExcel名。操作には詳細閲覧・ダウンロード・削除ボタンを配置。
* **詳細閲覧（リンクまたはボタン）:** 各履歴項目に「開く」リンクを設けます。クリックすると当該分析結果を**分析画面**に再現表示します。実装としては、分析画面を再利用しつつ過去データをロードする形を取ります。その際、新たにLLM実行は行わずデータベースに保存された結果をそのまま表示します。
* **ダウンロード（ボタン）:** 各履歴項目に直接ダウンロードボタンを設置し、ワンクリックでその結果のレポートPDFやデータを取得できるようにします。これにより履歴画面から過去結果を素早く取り出せます。
* **削除（ボタン）:** 各項目には削除ボタン（🗑アイコン）も配置します。ユーザが不要な履歴を手動で消去可能です。削除前に確認ダイアログを出し、「本当に削除しますか？」と念押しします。
* **ナビゲーション:** 画面上部に「←分析へ戻る」リンクまたはホームアイコンを配置し、履歴から分析画面へ戻り新規分析を行えるようにします。

**■ 機能要件:**

* **履歴一覧取得:** 画面表示時にデータベースから保存済み分析結果のメタデータを取得します。バックエンドAPI（例: `/api/listResults`）でJSON配列を受け取り、フロントで一覧を生成します。ソート順は新しい日時順（降順）で表示します。
* **ページング:** 保存件数が多くなる可能性を考慮し、一定件数（例: 10件）ごとにページング表示、または無限スクロールを実装します。Cursorにはページングの要件も伝えておき、コード生成時に対応させます。
* **検索・フィルタ（将来的拡張）:** 分析タイトルや日付でフィルターする検索バーを設置することも検討します（本要件の範囲では必須ではないが、拡張可能性として記述）。
* **詳細閲覧遷移:** 「開く」操作時、該当結果IDをクエリパラメータに含めて分析画面コンポーネントをロードするか、あるいはモーダルで分析詳細を表示します。ここではシンプルに分析画面にリダイレクトし、ロード時にIDがあればそのデータをDBから取得して表示するフローとします。
* **ダウンロード処理:** 履歴一覧からのダウンロードボタンも、分析画面同様にバックエンドへリクエストしてファイルを取得します（内部的には同じエンドポイントを使用可能）。履歴UI上でどの形式か選ばせる場合は、クリック時にメニューを出すなどしますが、基本はワンクリックで直ちに前回と同じ形式のファイルをダウンロードする想定です。
* **削除処理:** 削除ボタン押下→確認OK後、バックエンドAPI（例: `/api/deleteResult?id=XX`）を呼び出し該当レコードを削除します。削除成功後はフロントで当該項目をリストから即座に消去し、「削除しました」等通知します。誤削除対策として、削除取り消し（undo）を短時間受け付ける仕組みもあると良いでしょう（削除後一定時間は復元可能など）。

**■ UI/UX要件:**

* **一覧の見やすさ:** カード形式の場合は各カードをタイル状に並べ、タイトルや日時を太字で表示します。テーブル形式の場合はヘッダー行を固定表示にしてスクロール可能にします。どちらにせよ、多数の履歴を視認性高く表示できるよう余白や罫線を工夫します。
* **操作ボタンの配置:** 「開く」「ダウンロード」「削除」ボタン/アイコンはユーザが直感的に分かるアイコンを用い、一目で判別できるよう色分けも検討します（例: 削除は赤系）。ホバー時にツールチップで「詳細表示」「ダウンロード」「削除」と表示させます。
* **モバイル対応:** スマホでは横幅が狭いため、一覧を縦一列のカードリストにします。各カード内に日時・タイトル・ボタン類を縦配置し、必要に応じて折りたたみ表示（例えば詳細ボタンを押すと詳細情報が展開されるなど）で情報過多を防ぎます。
* **空状態メッセージ:** 保存済み履歴が一件もない場合、「まだ分析結果が保存されていません。分析を実行して『保存』することで、ここに結果が表示されます。」といった空状態（Empty State）メッセージを表示し、使用方法を案内します。
* **パフォーマンス:** 履歴数が増えても快適に操作できるよう、一覧表示は仮想リストレンダリングなどで最適化します。初期表示は最新10件程度にし、スクロールで追加読み込みする形が望ましいです。

**■ エラーハンドリング:**

* **一覧取得エラー:** 履歴メタデータの取得に失敗した場合、「履歴データを読み込めませんでした。ネットワーク接続をご確認ください。」等と表示し、再試行ボタンを提供します（ローカル環境なのでネットワークエラーは稀ですが、バックエンドダウン時などを想定）。
* **削除エラー:** 削除処理が失敗した場合（該当IDが既に無い、DBエラー等）は、「削除に失敗しました。再度お試しください。」と通知します。部分的な失敗（例: ファイルは消せたがDBレコードが消せない等）は整合性が崩れないようトランザクション管理を行います。
* **ダウンロードエラー:** ダウンロードに失敗した場合、「ファイルのダウンロードに失敗しました。時間をおいて再度お試しください。」とアラートします。必要に応じ、分析画面を開いて再度ダウンロードさせる誘導文も付記します。

## データベース設計

本システムで扱う主要なデータ（分析履歴やユーザアップロード情報）を管理するため、シンプルなスキーマを設計します。ローカル環境のためSQLiteを想定しますが、将来的なPostgreSQL等への移行も見据え、SQL標準に準拠した構造にします。

**● テーブル: `analysis_results`** – 分析結果のメタデータおよびコンテンツを保存するテーブル。履歴一覧表示や詳細再現に使用します。

* `id` (INTEGER, Primary Key, Auto-increment): ユニークID。
* `title` (TEXT): 分析結果のタイトルまたは概要。空の場合はNULL可。基本はユーザプロンプト内容の要約や自動生成タイトルが入ります。
* `file_name` (TEXT): アップロードされた元Excelファイル名。履歴表示用。
* `prompt_text` (TEXT): ユーザが入力したプロンプト全文。後で見返せるよう保存します。
* `result_text` (TEXT): AIが生成した分析結果テキスト全文。MarkdownやJSON断片を含む可能性もあり、そのまま保存します。
* `graphs_data` (TEXT): グラフ描画用データを保存。ここにはJSON文字列などでグラフ種別や系列データを格納します（LLM出力を後で再現するため）。シンプルにするなら、`result_text`内に埋め込まれたグラフ関連部分をそのまま持っておき、再表示時に再度パースして描画でも良いですが、検索性のため分離しています。
* `created_at` (DATETIME): 分析実行日時（保存日時）。デフォルトCURRENT\_TIMESTAMPで自動設定。

*(補足: Chart画像そのものは保持しません。再表示時に`graphs_data`を使って再描画します。ただしダウンロード用に画像が必要な場合、都度レンダリングするか、一時ファイルとして出力します。ストレージにバイナリファイルで画像を残す設計も可能ですが、本仕様ではテキストデータ中心に保存する方針とします。)*

**● テーブル: `analysis_metrics`** – （任意）個別の分析指標を構造化保存するテーブル。
こちらは拡張用で、例えばAIが算出した各種KPIをレコードとして保持したい場合に使用します。現時点では必須要件ではないため詳細は割愛しますが、カラム例として`result_id`（analysis\_resultsへの外部キー）, `metric_name`, `metric_value`など。

**● テーブル: `...`** – その他必要に応じてテーブルを追加します。本システムではユーザ管理や詳細な権限管理は無いため、基本上述の結果保存用テーブルのみで事足ります。アップロードされたExcelそのものはDBにBLOB保存せず、分析後は不要となる想定なので保持しません（必要ならアップロードファイル保存先パスを持たせることも検討）。

データベースのCRUD操作はバックエンドAPIから行い、Cursorでコード生成する際には上記テーブル構造を参考にモデル定義（ORMモデルやSQL作成）を行います。例えばNext.jsの場合Prisma/Drizzle ORM、Pythonの場合SQLAlchemyなどを使う選択肢がありますが、ここでは技術スタックに依存しない記述に留めています。

## プロンプト入力設計 (AIへの指示内容設計)

本システムではプロンプト（ユーザが入力するAIへの指示文）が分析内容を柔軟にコントロールする重要な役割を果たします。そこで、ユーザが有効な指示を出しやすく、AIがそれを正しく解釈できるよう、**プロンプト設計の方針**を定めます。

* **ユーザプロンプトの自由度:** 基本的にユーザは日本語で自由に指示を書けます。形式に厳密な制約は設けません。例: 「○○の指標を計算して」「△△を期間で比較してグラフにして」など自然文でOKです。技術的知識が無いユーザでも扱えるよう、「例えば…」のサジェストをUI上に表示し支援します。
* **想定される指示例:**

  * *例1*: 「**今月の各営業担当者の売上をランキング形式で示し、トップ3の名前は伏せ字にしてください。**」
    → AIはExcelデータから今月分を抽出し、担当者ごとの売上合計を計算、トップ3にランク付け。結果は「1位: **田中** (100万円)」「2位: **山田** (90万円)…」のように表示。ただし名前は伏せ字指定なので「田中」を「T氏」などに変更。
  * *例2*: 「**2022年から2024年までの四半期ごとの売上推移を折れ線グラフで可視化し、主要な変動要因について述べて。**」
    → AIは年度と四半期でグループ集計し、折れ線グラフ用データを生成。グラフ描画指示とともに、「2023年Q2に大きく伸びています。これは新製品効果によるものです…」等、変動要因の推測を文章で提供。
  * *例3*: 「**KPI: 月平均コンタクト件数と商談成立率を算出し、それぞれグラフ化してください。**」
    → 複数KPI指示。AIは「月平均コンタクト件数」の折れ線グラフ、「月間商談成立率」の棒グラフなど二つのグラフデータを用意し、文章中でそれぞれについて解説します。
* **プロンプトテンプレート（内部処理）:** システムは必要に応じ、ユーザプロンプトを補助するため内部でテンプレートを用いることがあります。例えば、アップロードデータのカラム情報を把握して「データには以下の列があります: ...」という情報をAIに先に与える、あるいは「出力はJSONで」などシステム側制御を追加するケースです。しかしユーザ指定の柔軟性を尊重するため、テンプレートは極力シンプルにし、*ユーザ入力がそのままAIの挙動に反映される*ようにします。
* **出力フォーマット指定:** ユーザが「○○な形式で出力して」と指示可能です。例えば「箇条書きで」「Markdown表で」「簡潔に」等。これら指定があれば、AIはそのフォーマットに沿った回答をします。Cursorでの自動コード生成時には、このような多様な出力に対応できるよう、返答をエスケープ処理したりMarkdownレンダリングするコードが組み込まれます。
* **トーン & スタイル:** ユーザが指定しない限り、AIの文体はビジネスレポート調（丁寧な口調、敬体）で出力されます。ユーザが「フランクな口調で」など書けば従います。これも含め、**LLMの挙動はプロンプト次第**で変えられるため、システム側では固定せずユーザ任せにします。
* **禁止事項への対応:** 一般常識として、差別的表現や個人情報の不適切な扱いは禁止します。基本はユーザ自身がプロンプトでコントロールしますが、システムとしても例えば「機微情報を含む出力は禁止」とシステムプロンプトに入れておくなど安全策は取ります。ただしローカルでユーザ自身が使う想定なので、厳格な内容フィルタリングは設けません。

以上のプロンプト設計指針により、ユーザは目的に応じた分析を自然言語でオーダーでき、AIはそれを解釈して臨機応変に応答します。**適切なプロンプト設計はAI活用の成否を分けるため、ユーザにはマニュアル等で好例を示し、Cursorにはこの仕様書を通じプロンプト重視の設計であることを理解させます。**

## AIエージェント構成 (分析AIの役割分担)

本システムでは、LLMを用いた分析機能を効果的に実現するために**AIエージェントの役割分担**を考慮します。単一のLLMに全てを任せるのではなく、目的に応じてエージェントを分けることで、より構造化された出力や高度なインサイト提供が可能になります。想定するエージェント構成は以下の通りです。

* **分析エージェント（Data Analysis Agent）:**
  メインのLLMエージェントです。入力された**営業データ**と**ユーザプロンプト**を受け取り、データの集計・分析・洞察抽出を行います。このエージェントはデータサイエンティストのような役割を果たし、与えられた指示に忠実に計算や推論を行います。出力としては、人間が読める**分析レポート文章**と、必要に応じ**グラフ描画用の情報**（データや推奨チャート形式）を生成します。
  *実装:* この役割はOllama上のLLM（例えば7B〜13B規模モデル）で実現します。プロンプトにはシステム指示として「あなたは分析エージェントです。データを解析し、ユーザの質問に答えてください。」等を与え、ツール利用無しでテキスト生成のみ行います。場合によっては、前処理計算結果をプロンプトに含め、人間とAIの協調で正確性を上げます。

* **UI提案エージェント（UI/Visualization Agent）:**
  補助的なLLMエージェントです。分析エージェントの出力を受け取り、**どのようにユーザに提示するのが最適か**を判断・提案します。具体的には、「この結果は棒グラフと折れ線グラフを並べて表示すると分かりやすい」「重要な部分は強調表示すべき」といったUI/UX上の示唆を与える役割です。
  *実装:* 分析結果テキストが得られた後、必要に応じて別のプロンプトでUI提案エージェントに問い合わせます（もしくは分析エージェントと同一モデルに追加質問する形でも可）。例えば「上記分析結果をユーザに見せる際の最適な可視化方法を教えて」といったプロンプトを投げ、回答として「棒グラフAと折れ線グラフBをタイトル付きで配置し、AではX軸に月、Y軸に売上...」のような具体案を得ます。この案をシステムが解析し、フロントのレイアウト組みに反映します。
  *備考:* Cursorによる自動開発時には、このUI提案も設計に含めておくことで、AIがコード生成時に適切なチャートコンポーネント配置やスタイリングを行うと期待できます。

* **（将来的拡張）他のエージェント:**
  必要であれば、データクリーニング専用のエージェントや、洞察の妥当性をチェックするエージェントなども考えられます。しかし現段階では上記2役割で十分と判断します。

エージェント間の情報の流れとしては、基本は**ユーザ → 分析エージェント（データ分析）→ 結果**というシンプルなものです。UI提案エージェントは内部的に分析結果を受けてUI構成をサジェストするだけで、最終的な画面構築はプログラム側（Cursor生成コード）が行います。マルチエージェントの考え方を導入することで、**小規模なローカルLLMでも役割分担により複雑なタスクをこなせる**と期待できます。

## Docker構成およびローカルLLM連携の設計方針

（※システム構成の章で既に触れていますが、AI自動開発ツールであるCursorに明確に認識させるため、DockerおよびLLM連携部分の設計ポイントを改めて整理します。）

* **Dockerイメージ構成:**

  * アプリケーション用Dockerfileを用意し、Node.jsランタイム（またはPython環境）を構築します。ソースコード一式（フロント・バックエンド）をCOPYし、依存パッケージをインストールする構成です。必要に応じてビルド（Next.jsなら`npm run build`）も行います。
  * Ollama用には公式の`ollama/ollama`イメージを使用します。これはDockerHubで提供されており、`ollama serve`コマンドでモデル推論サーバを起動します。利用するモデル（例: `ollama pull llama3`など）はコンテナ起動後に取得するか、`Modelfile`を用意してビルド時に組み込むことも可能です。
  * docker-compose.ymlで、上記2つのコンテナを定義し、`depends_on`でアプリ→ollamaの依存関係を記述します。起動順序は厳密には不要ですが、念のためLLMエンジンが先に立ち上がっていることを保証します。
  * ネットワーキングはデフォルトのbridgeで良く、環境変数としてアプリコンテナに`OLLAMA_API_URL=http://ollama:11434`のように設定し、そこをバックエンドが参照してLLMと通信します。
* **ボリュームと永続化:**

  * DB永続化のため、アプリコンテナにボリュームマウント（例: ホストの`./db`ディレクトリをコンテナの`/app/sqlite`にマウント）します。これによりコンテナ再作成時も履歴データが保持されます。
  * Ollama用にも、モデルデータ永続化のためnamed volume (`ollama`ボリューム) を使用します。これで一度ダウンロードしたモデルを次回以降すぐ利用できます。
* **LLMモデル選定とサイズ:**

  * ローカルLLMは性能上、大規模な70Bモデルより中規模(7B〜13B)が現実的です。日本語の営業データ分析に適したモデルを選びます。例: Llama2 Japaneseチューニングモデル、OpenAI互換のGPT4All系列など。必要に応じ複数モデルを試し、`Ollama run`コマンドで応答品質と速度を比較します。
  * モデルのコンテキスト長も留意します（例えば8192トークン程度あれば中〜大規模データも対応可）。選定理由やパラメータはこの仕様書に記載しておくと、Cursorがコード内でモデル名を扱いやすくなります。
* **起動・デプロイ:**

  * 開発時は`docker-compose up`で両コンテナを起動します。Cursor経由でデプロイする際も、必要ならCI/CDパイプラインにDockerビルドを組み込みます。DocDD手法では、本仕様書からDocker設定も自動生成するため、ここに記載したポート/サービス名/イメージ名等がそのままComposeファイルに反映されることが期待されます。
  * ローカル実行のみを想定していますが、もし社内サーバ等にデプロイする場合もDockerイメージを移すだけで再現できます。
* **セキュリティ:**

  * ローカル環境前提のため大きな脅威はありませんが、Dockerイメージには最新のセキュリティパッチを適用し、不要なポートは公開しません。Ollamaの11434ポートも外部（ホスト）には開けず、アプリコンテナからのみアクセス可能に設定するのも一案です（docker-composeのネットワーク設定で`internal`にする等）。
  * また、モデルはローカルとはいえ機密情報を扱うため、分析終了後にメモリ上のデータを消去するなどの配慮も考えられます（モデルがどこまでデータを保持するかは不明瞭ですが、一応の記載）。

以上のDockerおよびLLM連携設計により、**環境セットアップから実行までを自動化**できる見通しです。Cursorはこの仕様をもとに、適切なDockerファイル群や接続コードを生成するでしょう。実際にCursor Composer等に本ドキュメントを与えることで、AIが**コーディングからインフラ構築まで一貫して自動生成**してくれることを期待します。

## おわりに (DocDDによる自動開発の展望)

以上、ローカルLLM分析システムの詳細設計を記述しました。本仕様書自体が**AIでも理解できる構造**を意識しており、Cursor等のAIコーディング支援ツールに投入することで、自動的にプロジェクトの雛形やコード実装が生成されることを目指しています。実際、画面設計書・API設計書・コンポーネント設計書といったファイル群に分割して管理するアプローチも有効であり、本ドキュメントはその統合版と位置付けられます。

今後の展望として、生成されたアプリを実際に動作させ、LLMの精度調整やプロンプトの改善を行うフェーズがあります。また、ユーザ企業の要望に応じて項目追加や分析ロジック変更が出た場合も、本仕様書を更新しCursorで再生成することで対応できます。これにより、反復的な要件変更にも迅速に追従できる**ドキュメント駆動開発 (DocDD)** を実現します。

本調査および仕様策定の結果、ローカル環境で完結する安全なLLM分析プラットフォームの設計方針が明確になりました。あとはこのドキュメントをCursorに読み込ませ、AIエージェントたちにコードを書かせるだけです。必要なものは揃っています。自動生成されるアプリケーションが本仕様の意図通りとなるよう、引き続き検証・微調整を行いつつ開発を進めていきます。

**参考文献・出典:** 本仕様書作成にあたり以下の資料を参照しました。

* AI駆動開発に適した要件定義書のフォーマットとDocDD手法
* Cursorを用いた画面設計書の記述例（Markdown構造）
* Cursorにおける仕様フォルダ構成とドキュメント分割の例
* Ollamaを使ったローカルLLM実行方法（Docker構成例）
* プロンプトによる分析指示とグラフ生成のChatGPT活用例
* ローカルLLMのマルチエージェント連携によるタスク解決の試み

以上。
