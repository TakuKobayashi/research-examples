#!/usr/bin/env bash
# Build frontend, generate API docs, then copy to worker/assets for Cloudflare deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/packages/frontend"
WORKER_DIR="$SCRIPT_DIR/packages/worker"
ASSETS_DIR="$WORKER_DIR/assets"

echo "==> Installing dependencies..."
npm install

echo "==> Generating API reference docs..."
cd "$FRONTEND_DIR"
npm run build:docs

echo "==> Building Next.js static export..."
npm run build:next

echo "==> Copying to worker/assets/..."
rm -rf "$ASSETS_DIR"
cp -r "$FRONTEND_DIR/out" "$ASSETS_DIR"

echo "==> Worker assets ready at packages/worker/assets/"
echo ""
echo "Next step: cd packages/worker && npm run deploy"
