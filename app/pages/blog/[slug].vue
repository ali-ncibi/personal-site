<script setup lang="ts">
import { posts } from '~/data/posts'
import { profile } from '~/data/profile'

const route = useRoute()
const foundPost = posts.find((item) => item.slug === route.params.slug)

if (!foundPost) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' })
}

const post = foundPost
const socialImage = post.coverImage
const socialImageUrl = new URL(socialImage.url, profile.siteUrl).href
const pageTitle = `Ali Ncibi - ${post.title}`
const relatedPublications = (post.relatedPublicationUrls ?? []).map((url) => {
  const publication = profile.publications.find((item) => item.url === url)
  if (!publication) {
    throw new Error(`Related publication not found: ${url}`)
  }
  return publication
})

useSeoMeta({
  title: pageTitle,
  description: post.excerpt,
  ogTitle: pageTitle,
  ogDescription: post.excerpt,
  ogSiteName: profile.name,
  ogLocale: 'en_US',
  ogType: 'article',
  ogUrl: `${profile.siteUrl}${route.path}`,
  ogImage: socialImageUrl,
  ogImageWidth: socialImage.width,
  ogImageHeight: socialImage.height,
  ogImageType: socialImage.mimeType,
  ogImageAlt: socialImage.alt,
  articleSection: post.category,
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription: post.excerpt,
  twitterImage: socialImageUrl,
  twitterImageAlt: socialImage.alt,
})

useHead({
  link: [{ rel: 'canonical', href: `${profile.siteUrl}${route.path}` }],
})

function repositoryFileUrl(path: string): string {
  const base = post.series?.repositoryUrl
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return base ? `${base}/blob/main/${encodedPath}` : ''
}
</script>

<template>
  <article class="w-full pb-24">
    <header class="relative isolate -mt-16 min-h-screen overflow-hidden bg-slate-950 text-white">
      <img
        v-if="post.coverImage"
        class="absolute inset-0 h-full w-full object-cover"
        :src="post.coverImage.url"
        :alt="post.coverImage.alt"
        :width="post.coverImage.width"
        :height="post.coverImage.height"
        loading="eager"
        fetchpriority="high"
        decoding="async"
      >
      <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/10" />
      <div aria-hidden="true" class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div class="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-6xl px-5 pt-8">
        <NuxtLink class="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-md border border-white/40 bg-slate-950/35 px-3 py-2 text-sm font-bold text-white backdrop-blur-sm hover:bg-slate-950/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" to="/blog">← All notes</NuxtLink>
      </div>
      <div class="relative mx-auto flex min-h-[620px] w-full max-w-6xl flex-col justify-end px-5 pb-12 pt-32 sm:min-h-[640px] sm:pb-14 sm:pt-36 lg:min-h-[680px]">
        <p v-if="post.series" class="mb-4 text-sm font-bold text-blue-100">
          {{ post.series.title }} · Part {{ post.series.part }} of {{ post.series.total }}
        </p>
        <p class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-white/90">
          <span>{{ post.date }}</span>
          <span aria-hidden="true" class="h-4 w-px bg-white/50" />
          <span>{{ post.category }}</span>
          <span aria-hidden="true" class="h-4 w-px bg-white/50" />
          <span>{{ post.readTime }}</span>
        </p>
        <h1 class="text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">{{ post.title }}</h1>
        <p class="mt-5 text-lg leading-8 text-slate-100 drop-shadow sm:text-xl">{{ post.intro }}</p>
        <p class="mt-5 text-sm font-bold text-white/90">Ali Ncibi · AI Engineer &amp; PhD</p>
      </div>
    </header>
    <div class="mx-auto w-full max-w-6xl px-5 pt-12 lg:pt-16">
      <section v-for="section in post.sections" :key="section.heading" class="mb-8">
        <h2 class="mb-3 text-2xl font-bold tracking-tight">{{ section.heading }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph" class="mb-4 text-base leading-8 text-slate-700 dark:text-slate-300">{{ paragraph }}</p>
        <pre v-if="section.code" class="my-5 overflow-x-auto rounded-md border-2 border-slate-900 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><code>{{ section.code.content }}</code></pre>
        <figure v-if="section.video" class="my-6">
          <video class="w-full rounded-md border-2 border-slate-900 bg-black dark:border-slate-700" controls preload="metadata" :poster="section.video.poster" :aria-label="section.video.caption">
            <source :src="section.video.src" type="video/mp4">
            Your browser does not support embedded video.
            <a :href="section.video.src">Download the video</a>.
          </video>
          <figcaption class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ section.video.caption }}</figcaption>
        </figure>
      </section>
      <aside v-if="relatedPublications.length" class="mt-10 border-y-2 border-slate-900 py-5 dark:border-slate-800">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Related publications</p>
        <ul class="flex flex-col gap-4">
          <li v-for="publication in relatedPublications" :key="publication.url">
            <a class="font-bold text-blue-900 hover:underline dark:text-blue-200" :href="publication.url" target="_blank" rel="noreferrer">
              {{ publication.title }}
            </a>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ publication.venue }}</p>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ publication.location }}</p>
          </li>
        </ul>
      </aside>
      <aside v-if="post.references?.length" class="mt-10 border-y-2 border-slate-900 py-5 dark:border-slate-800">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Code and reproduction notes</p>
        <ul class="flex flex-wrap gap-x-5 gap-y-2">
          <li v-for="reference in post.references" :key="reference.url">
            <a class="text-sm text-blue-900 hover:underline dark:text-blue-200" :href="reference.url" target="_blank" rel="noopener noreferrer">
              {{ reference.title }} ↗
            </a>
          </li>
        </ul>
      </aside>
    </div>
    <aside v-if="post.series" class="mx-auto mt-10 w-full max-w-6xl border-t-2 border-slate-900 px-5 pt-5 dark:border-slate-800">
      <div class="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p class="mb-2 text-sm font-bold text-blue-900 dark:text-blue-200">Implementation references</p>
          <p class="text-sm text-slate-600 dark:text-slate-300">{{ post.series.title }} · Part {{ post.series.part }} of {{ post.series.total }}</p>
        </div>
        <a class="text-sm font-bold text-blue-900 hover:underline dark:text-blue-200" :href="post.series.repositoryUrl" target="_blank" rel="noopener noreferrer">
          Repository <span aria-hidden="true">↗</span>
        </a>
      </div>
      <ul class="my-4 flex flex-wrap gap-x-5 gap-y-2">
        <li v-for="file in post.series.sourceFiles" :key="file">
          <a class="text-sm text-blue-900 hover:underline dark:text-blue-200" :href="repositoryFileUrl(file)" target="_blank" rel="noopener noreferrer">{{ file }} ↗</a>
        </li>
      </ul>
      <nav class="flex items-center justify-between gap-3 border-y border-slate-900 py-4 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300" :aria-label="`${post.series.title} parts`">
        <NuxtLink v-if="post.series.previousSlug" class="font-bold text-blue-900 dark:text-blue-200" :to="`/blog/${post.series.previousSlug}`">
          ← Part {{ post.series.part - 1 }}
        </NuxtLink>
        <span>Part {{ post.series.part }} / {{ post.series.total }}</span>
        <NuxtLink v-if="post.series.nextSlug" class="font-bold text-blue-900 dark:text-blue-200" :to="`/blog/${post.series.nextSlug}`">
          Part {{ post.series.part + 1 }} →
        </NuxtLink>
      </nav>
      <p v-if="post.series.discussionEmail" class="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Questions or corrections?
        <a class="font-bold text-blue-900 hover:underline dark:text-blue-200" :href="`mailto:${post.series.discussionEmail}`">{{ post.series.discussionEmail }}</a>
      </p>
    </aside>
  </article>
</template>
