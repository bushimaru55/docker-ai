FROM node:20-bullseye

WORKDIR /app

# 必要なビルド依存をインストール
RUN apt-get update && apt-get install -y python3 make g++ sqlite3

COPY package*.json ./

# sqlite3をビルド付きでインストール（PYTHON環境変数を明示）
RUN PYTHON=$(which python3) npm install sqlite3 --build-from-source

# 他の依存もインストール
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "dev"] 