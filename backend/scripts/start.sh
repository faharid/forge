#!/bin/sh
set -e

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Running database migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js 2>/dev/null || \
    echo "Note: migrations skipped (run manually if needed)"
fi

echo "Starting Forge API on port ${PORT:-3001}..."
exec node dist/main.js
