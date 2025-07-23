#!/bin/bash
cd /home/kavia/workspace/code-generation/match-stream-viewer-16511/ott_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

