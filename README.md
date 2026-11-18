# Ali's personal site

A small Nuxt portfolio and blog, deployed as a static site on GitHub Pages.

## Run locally

```sh
npm install
npm run dev
```

## Add a blog post

Add a post to `app/data/posts.ts`. Include its slug in `nuxt.config.ts` under
`nitro.prerender.routes` so GitHub Pages generates a page for it.

The GitHub Actions workflow deploys the site on pushes to `main`.
