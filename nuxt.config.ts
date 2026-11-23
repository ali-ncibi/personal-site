export default defineNuxtConfig({
  compatibilityDate: '2026-11-17',
  modules: ['@nuxt/content', '@nuxt/fonts', '@nuxt/icon', '@nuxt/eslint', '@nuxtjs/tailwindcss'],
  tailwindcss: {
    config: {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Lato', 'sans-serif'],
          },
          boxShadow: {
            'hard-sm': '0.25rem 0.25rem 0 #000',
            'hard-md': '0.375rem 0.375rem 0 #000',
            'hard-lg': '0.5rem 0.5rem 0 #000',
            'hard-sm-dark': '0.25rem 0.25rem 0 #94a3b8',
            'hard-md-dark': '0.375rem 0.375rem 0 #94a3b8',
            'hard-lg-dark': '0.5rem 0.5rem 0 #94a3b8',
          },
        },
      },
    },
  },
  postcss: { plugins: { 'tailwindcss/nesting': false } },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#111a24', media: '(prefers-color-scheme: dark)' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'index, follow' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  devtools: { enabled: true },
  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: ['/blog'],
    },
  },
})
