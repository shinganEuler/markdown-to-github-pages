#!/bin/bash

git pull && git add . && git commit -m "update" && git push && npm publish
