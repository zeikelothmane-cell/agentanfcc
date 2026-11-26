FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
USER node
CMD ["npm","start"]
