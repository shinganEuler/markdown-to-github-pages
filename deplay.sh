#!/bin/bash

python3 toc.py

git pull && git add . && git commit -m "update" && git push
