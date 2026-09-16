FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
# We can provide a dummy URL for build time if necessary, but typically Next.js standalone build is best if configured.
# Here we just run normal next build.
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

