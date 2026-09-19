FROM node:20-slim
# Install openssl for prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 5000
CMD npx prisma migrate deploy && npm run prisma:seed && node dist/server.js

