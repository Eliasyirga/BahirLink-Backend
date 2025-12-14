#!/bin/bash

mkdir -p models
cd models

BASE="https://github.com/vladmandic/face-api/raw/master/model"

files=(
  "ssdMobilenetv1_model-weights_manifest.json"
  "ssd_mobilenetv1_model-shard1"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1"
)

for file in "${files[@]}"; do
  echo "Downloading $file..."
  curl -L -o $file "$BASE/$file"
done

echo "Model download complete."
