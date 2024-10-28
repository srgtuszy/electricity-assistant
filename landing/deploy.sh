#! /bin/bash

mkdir -p public
cp index.html public/index.html
firebase deploy --only hosting:green-go-landing
rm -rf public
