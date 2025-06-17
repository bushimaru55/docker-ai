FROM node:20-alpine

WORKDIR /app

# セキュリティアップデート
RUN apk update && apk upgrade && apk add --no-cache dumb-init

COPY package*.json ./

# npmのアップデートとセキュリティ修正
RUN npm install -g npm@latest && npm audit fix || true && npm install

COPY . .

EXPOSE 3000

# 非rootユーザーで実行
USER node

# dumb-initを使用してプロセス管理を改善
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"] 