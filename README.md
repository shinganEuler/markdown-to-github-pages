# markdown-to-github-pages

Convert markdown files to github pages with katex support.

```
async function generateGithubPages(srcDir, destDir, config)

// srcDir: markdown files directory
// destDir: github pages output directory
// config: yaml config file path

// config example:
/*
title: "your site title"
url: "your site url"

template:
  head: "insert some code to head"
  body: "insert some code to body"
  foot: "insert some code to foot"
*/

```