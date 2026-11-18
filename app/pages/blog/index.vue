<script setup lang="ts">
import { posts } from '~/data/posts'
import { profile } from '~/data/profile'

const pageTitle = 'Ali Ncibi - Notes'

useSeoMeta({
  title: pageTitle,
  description: 'Research notes and writing on machine learning, NLP, and production AI.',
  ogTitle: pageTitle,
  ogDescription: 'Research notes and writing on machine learning, NLP, and production AI.',
  ogSiteName: profile.name,
  ogLocale: 'en_US',
  ogType: 'website',
  ogUrl: `${profile.siteUrl}/blog/`,
  ogImage: `${profile.siteUrl}/images/og-blog.jpg`,
  ogImageWidth: 1024,
  ogImageHeight: 768,
  ogImageType: 'image/jpeg',
  ogImageAlt: 'Ali Ncibi — notes and research',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: 'Research notes and writing on machine learning, NLP, and production AI.',
  twitterImage: `${profile.siteUrl}/images/og-blog.jpg`,
  twitterImageAlt: 'Ali Ncibi — notes and research',
})

useHead({
  link: [{ rel: 'canonical', href: `${profile.siteUrl}/blog/` }],
})
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-7 pb-24 pt-10 max-sm:px-5 max-sm:pt-7">
    <div class="flex justify-between border-b-2 border-slate-900 pb-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300" aria-label="Notes and research">
      <span>Notes &amp; research</span>
      <span>Ali Ncibi</span>
    </div>
    <header class="max-w-3xl py-10 max-sm:py-7">
      <h1 class="text-5xl font-extrabold leading-tight tracking-tighter sm:text-5xl">Writing from the workbench.</h1>
      <p class="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">Research notes, engineering lessons, and ideas I’m still thinking through.</p>
    </header>
    <div>
      <article v-for="post in posts" :key="post.slug" class="flex items-start justify-between gap-5 border-t-2 border-slate-900 py-6 dark:border-slate-800">
        <div class="min-w-0">
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ post.date }} <span class="px-1">·</span> {{ post.category }} <span class="px-1">·</span> {{ post.readTime }}</p>
          <h2 class="my-2 text-2xl font-bold tracking-tight sm:text-3xl"><NuxtLink class="hover:text-blue-900 dark:hover:text-blue-200" :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink></h2>
          <p class="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">{{ post.excerpt }}</p>
        </div>
        <NuxtLink class="grid size-10 shrink-0 place-items-center rounded-md border-2 border-slate-900 bg-blue-900 text-white shadow-hard-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-blue-200 dark:text-slate-950 dark:hover:bg-blue-100 dark:shadow-hard-sm-dark" :to="`/blog/${post.slug}`" :aria-label="`Read ${post.title}`">
          <Icon name="lucide:arrow-up-right" class="size-5" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </div>
</template>
