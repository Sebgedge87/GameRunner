#!/bin/sh
# If AUTO_SEED=true, run the seed script before starting the server.
# Set AUTO_SEED=true in your Railway (or other) environment variables
# to populate demo users and vault content on first deploy.
if [ "$AUTO_SEED" = "true" ]; then
  echo "AUTO_SEED=true — running seed..."
  node --experimental-sqlite server/src/db/seed.js
fi
exec node --experimental-sqlite server/src/index.js
