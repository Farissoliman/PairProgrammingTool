FROM node:18-alpine

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3030
CMD ["node", "ws_server.mjs"]