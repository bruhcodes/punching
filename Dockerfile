FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY . .

RUN corepack pnpm@9.0.0 install --frozen-lockfile --force
RUN corepack pnpm@9.0.0 --filter @workspace/api-server run build

ENV NODE_ENV=production
EXPOSE 3013

CMD ["sh", "-c", "corepack pnpm@9.0.0 --filter @workspace/api-server run start"]
