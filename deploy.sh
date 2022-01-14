#!/bin/bash

if [ ! -d "./dist" ]; then
  mkdir ./dist
fi

cp -f index.html ./dist

cp -rf ./assets/ ./dist/assets
cp -rf ./pages/ ./dist/pages

npx gh-pages -d dist