# Step 1: Node.js ka official image lena
FROM node:20-slim AS base

# pnpm ko global install karna kyunki aapka project pnpm use karta hai
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Project folder set karna container ke andar
WORKDIR /app

# Sabhi package.json aur workspace files ko copy karna
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/ ./src
# Agar koi aur local workspace dependency hai toh unhe bhi copy karein
COPY . .

# Saare packages install karna
RUN pnpm install --freeze-lockfile

# TypeScript code ko JavaScript me build/compile karna
RUN pnpm --filter @workspace/api-server run build

# Server ko chalane ke liye environment variable set karna
ENV NODE_ENV=production
ENV PORT=7860

# Hugging Face isi port (7860) ko listen karta hai
EXPOSE 7860

# Server ko start karne ki final command
CMD ["pnpm", "--filter", "@workspace/api-server", "run", "start"]

