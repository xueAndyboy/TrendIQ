#!/bin/bash
# TrendIQ Local Startup Script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

PORT=${PORT:-5050}

echo "=========================================="
echo "🚀 Starting TrendIQ AI Prediction Platform"
echo "🌐 Local URL: http://127.0.0.1:$PORT"
echo "=========================================="

./venv/bin/python app.py
