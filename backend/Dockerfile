FROM node:20-bookworm

WORKDIR /app

# OSパッケージのアップデートと依存インストール
RUN apt-get update && apt-get upgrade -y && apt-get install -y python3 make g++ sqlite3 && apt-get clean

COPY package*.json ./

# npmのアップデートと脆弱性自動修正
RUN npm install -g npm@latest
RUN npm audit fix || true

# sqlite3をビルド付きでインストール（PYTHON環境変数を明示）
RUN PYTHON=$(which python3) npm install sqlite3 --build-from-source

# 他の依存もインストール
RUN npm install

COPY . .

RUN npm run build

# 不要なビルド依存の削除
RUN apt-get remove --purge -y make g++ python3 && apt-get autoremove -y && apt-get clean

EXPOSE 3001

USER node

CMD ["npm", "run", "dev"] 