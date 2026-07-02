#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install --omit=dev --no-fund --loglevel=error
fi
node cleanup.js
