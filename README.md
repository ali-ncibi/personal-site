# Ali's personal site

A small Nuxt portfolio and blog, deployed as a static site on GitHub Pages.

## Run locally

```sh
npm install
npm run dev
```

## Add a blog post

Add a markdown file to `content/blog/` (the file name becomes the post slug,
e.g. `content/blog/my-post.md` → `/blog/my-post`). Give it YAML frontmatter:

```yaml
---
title: My post title
date: '2026-11-18'
category: Research note
readTime: 10 min read
summary: One-sentence description shown on the blog index and in SEO meta tags.
intro: Paragraph shown in the post hero.
coverImage:
  url: /covers/my-post.jpg
  alt: Cover image description
  width: 1024
  height: 768
  mimeType: image/jpeg
---
```

The body is standard markdown (headings, links, lists, tables, fenced code
blocks, inline HTML such as `<video>`). Optional frontmatter fields:
`references`, `relatedPublicationUrls`, `series`. Pages are prerendered
automatically by crawling `/blog` — no config change needed.

The GitHub Actions workflow deploys the site on pushes to `main`.
