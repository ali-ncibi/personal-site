<script setup lang="ts">
import { profile } from '~/data/profile'

const { data: latestNotes } = await useAsyncData('home-latest-notes', () =>
  queryCollection('blog').order('date', 'DESC').limit(10).all(),
)
const noteCount = computed(() => latestNotes.value?.length ?? 0)
const current = ref(0)
const currentPost = computed(() => latestNotes.value?.[current.value])
const pageTitle = 'Ali Ncibi - Homepage'

function nextNote() {
  if (noteCount.value > 0) current.value = (current.value + 1) % noteCount.value
}

function previousNote() {
  if (noteCount.value > 0) current.value = (current.value - 1 + noteCount.value) % noteCount.value
}

let touchStartX = 0
function onTouchStart(event: TouchEvent) {
  touchStartX = event.changedTouches[0]!.clientX
}

function onTouchEnd(event: TouchEvent) {
  const delta = event.changedTouches[0]!.clientX - touchStartX
  if (Math.abs(delta) > 40) {
    if (delta < 0) nextNote()
    else previousNote()
  }
}

useSeoMeta({
  title: pageTitle,
  description:
    'AI engineer and PhD working across machine learning, NLP, human activity recognition, and production AI systems.',
  ogTitle: pageTitle,
  ogDescription:
    'AI engineer and PhD working across machine learning, NLP, human activity recognition, and production AI systems.',
  ogSiteName: profile.name,
  ogLocale: 'en_US',
  ogType: 'website',
  ogUrl: `${profile.siteUrl}/`,
  ogImage: `${profile.siteUrl}/images/og-home.jpg`,
  ogImageWidth: 1024,
  ogImageHeight: 768,
  ogImageType: 'image/jpeg',
  ogImageAlt: 'Ali Ncibi — AI engineer and researcher',
  twitterCard: 'summary_large_image',
  twitterTitle: pageTitle,
  twitterDescription:
    'AI engineer and PhD working across machine learning, NLP, human activity recognition, and production AI systems.',
  twitterImage: `${profile.siteUrl}/images/og-home.jpg`,
  twitterImageAlt: 'Ali Ncibi — AI engineer and researcher',
})

useHead({
  link: [{ rel: 'canonical', href: `${profile.siteUrl}/` }],
})
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-7 pb-24 pt-10 max-sm:px-5 max-sm:pt-7">
    <section class="mb-7 rounded-xl border-2 border-slate-900 bg-slate-50 p-7 shadow-hard-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-hard-lg-dark max-sm:p-4" aria-labelledby="intro-title">
      <div class="grid grid-cols-1 gap-4 py-2 md:grid-cols-4 md:gap-8">
        <div class="min-w-0 md:col-span-3">
          <h1 id="intro-title" class="text-6xl font-extrabold leading-none tracking-tighter sm:text-7xl">Ali Ncibi</h1>
          <p class="mt-4 text-base font-bold sm:text-lg">AI Engineer <span class="px-1 text-slate-500">·</span> PhD in Computer Science / AI</p>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">{{ profile.introduction }}</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <a class="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-blue-900 shadow-hard-sm hover:bg-blue-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200 dark:hover:bg-blue-200 dark:hover:text-slate-950 dark:shadow-hard-sm-dark" :href="`mailto:${profile.email}`"><Icon name="lucide:mail" class="size-4" aria-hidden="true" />{{ profile.email }}</a>
            <a class="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-blue-900 shadow-hard-sm hover:bg-blue-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200 dark:hover:bg-blue-200 dark:hover:text-slate-950 dark:shadow-hard-sm-dark" :href="profile.links.github" target="_blank" rel="noreferrer"><Icon name="lucide:code-xml" class="size-4" aria-hidden="true" />GitHub</a>
            <a class="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-blue-900 shadow-hard-sm hover:bg-blue-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200 dark:hover:bg-blue-200 dark:hover:text-slate-950 dark:shadow-hard-sm-dark" :href="profile.links.linkedin" target="_blank" rel="noreferrer"><Icon name="lucide:briefcase-business" class="size-4" aria-hidden="true" />LinkedIn</a>
            <a class="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-white px-3 py-2 text-sm font-bold text-blue-900 shadow-hard-sm hover:bg-blue-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200 dark:hover:bg-blue-200 dark:hover:text-slate-950 dark:shadow-hard-sm-dark" :href="encodeURI(profile.cvUrl)" download="Ali-Ncibi-CV.pdf"><Icon name="lucide:file-down" class="size-4" aria-hidden="true" />Download CV</a>
          </div>
        </div>
        <figure class="order-first w-28 border-2 border-slate-900 bg-blue-900 p-1.5 shadow-hard-md sm:w-32 md:order-none md:col-span-1 md:w-full dark:border-slate-700 dark:bg-blue-200 dark:shadow-hard-md-dark">
          <img
            class="aspect-[4/5] w-full object-cover object-center"
            :src="profile.avatarUrl"
            :alt="`Portrait of ${profile.name}`"
            width="1122"
            height="1402"
            fetchpriority="high"
          >
          <figcaption class="grid gap-1 px-1 pt-2 text-xs font-bold text-white dark:text-slate-950"><span>FIG. 01</span><span>Ali Ncibi</span></figcaption>
        </figure>
      </div>
      <dl class="mt-5 grid grid-cols-1 gap-4 border-t-2 border-slate-900 pt-4 sm:grid-cols-3 dark:border-slate-700">
        <div>
          <dt class="mb-1 text-sm font-bold text-blue-900 dark:text-blue-200">Research</dt>
          <dd class="text-sm leading-6 text-slate-600 dark:text-slate-300">Human activity recognition · NLP · machine learning</dd>
        </div>
        <div>
          <dt class="mb-1 text-sm font-bold text-blue-900 dark:text-blue-200">Engineering</dt>
          <dd class="text-sm leading-6 text-slate-600 dark:text-slate-300">LLM systems · data pipelines · infrastructure</dd>
        </div>
        <div>
          <dt class="mb-1 text-sm font-bold text-blue-900 dark:text-blue-200">Availability</dt>
          <dd class="text-sm leading-6 text-slate-600 dark:text-slate-300">{{ profile.location }} · available for opportunities</dd>
        </div>
      </dl>
    </section>

    <section id="about" class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="about-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">About</p>
        <h2 id="about-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">From research questions to working systems.</h2>
      </div>
      <div class="space-y-4 text-base leading-7 text-slate-600 dark:text-slate-300 md:col-span-8">
        <p>I’m an AI engineer with a PhD in computer science. My work brings together machine learning, natural-language processing, and practical software engineering—from studying how sensor data represents human activity to building and evaluating LLM applications. I care about sound experiments, transparent evaluation, and systems that remain useful beyond a prototype. 
        </p>
      </div>
    </section>

    <section id="research" class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="research-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Research &amp; experience</p>
        <h2 id="research-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">Machine learning, grounded in evidence.</h2>
      </div>
      <div class="grid gap-7 md:col-span-8">
        <article v-for="job in profile.experience" :key="job.organization" class="grid gap-2 md:grid-cols-3 md:gap-6">
          <div class="flex gap-3 text-sm text-slate-500 dark:text-slate-400 md:block">
            <p>{{ job.dates }}</p>
            <p>{{ job.location }}</p>
          </div>
          <div class="md:col-span-2">
            <h3 class="font-bold">{{ job.role }} <span class="font-normal text-slate-600 dark:text-slate-300">· {{ job.organization }}</span></h3>
            <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ job.summary }}</p>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 marker:text-blue-900 dark:text-slate-300 dark:marker:text-blue-200">
              <li v-for="highlight in job.highlights" :key="highlight">{{ highlight }}</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <section id="projects" class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="projects-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Selected projects</p>
        <h2 id="projects-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">Building across the AI stack.</h2>
      </div>
      <div class="grid gap-7 md:col-span-8">
        <article v-for="project in profile.projects" :key="project.title" class="border-b border-slate-300 pb-6 last:border-0 last:pb-0 dark:border-slate-700">
          <div class="flex items-start justify-between gap-4 max-sm:flex-col">
            <div>
              <h3 class="font-bold">{{ project.title }}</h3>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ project.subtitle }}</p>
            </div>
            <span class="shrink-0 text-sm text-slate-500 dark:text-slate-400">{{ project.dates }}</span>
          </div>
          <p class="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ project.description }}</p>
          <ul class="my-3 flex list-none flex-wrap gap-2" :aria-label="`${project.title} technologies`">
            <li v-for="technology in project.technologies" :key="technology" class="rounded-md border border-slate-400 bg-blue-50 px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">{{ technology }}</li>
          </ul>
          <a class="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:underline dark:text-blue-200" :href="project.url" target="_blank" rel="noreferrer">
            Source code <Icon name="lucide:arrow-up-right" class="size-4" aria-hidden="true" />
          </a>
        </article>
      </div>
    </section>

    <section id="publications" class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="publications-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Publications</p>
        <h2 id="publications-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">Research in human activity recognition.</h2>
      </div>
      <ol class="list-decimal space-y-5 pl-6 marker:font-bold marker:text-blue-900 dark:marker:text-blue-200 md:col-span-8">
        <li v-for="publication in profile.publications" :key="publication.url" class="pl-1">
          <h3 class="font-semibold leading-6"><a class="hover:text-blue-900 dark:hover:text-blue-200" :href="publication.url" target="_blank" rel="noreferrer">{{ publication.title }}</a></h3>
          <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ publication.venue }}</p>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ publication.location }} <a class="ml-2 font-semibold text-blue-900 dark:text-blue-200" :href="publication.url" target="_blank" rel="noreferrer">HAL ↗</a></p>
        </li>
      </ol>
    </section>

    <section id="education" class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="education-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Education</p>
        <h2 id="education-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">A foundation in engineering and AI.</h2>
      </div>
      <div class="grid gap-4 md:col-span-8">
        <article v-for="education in profile.education" :key="education.degree" class="flex items-start justify-between gap-4 border-b border-slate-300 pb-4 last:border-0 last:pb-0 max-sm:flex-col dark:border-slate-700">
          <div>
            <h3 class="font-bold">{{ education.degree }}</h3>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ education.institution }}</p>
            <p v-if="education.detail" class="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{{ education.detail }}</p>
          </div>
          <span class="shrink-0 text-sm text-slate-500 dark:text-slate-400">{{ education.dates }}</span>
        </article>
      </div>
    </section>

    <section class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="skills-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Toolkit</p>
        <h2 id="skills-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">Tools I work with.</h2>
      </div>
      <div class="grid gap-4 md:col-span-8">
        <div v-for="skill in profile.skills" :key="skill.group" class="grid gap-1 sm:grid-cols-3 sm:gap-4">
          <h3 class="text-sm font-bold">{{ skill.group }}</h3>
          <p class="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:col-span-2">{{ skill.items }}</p>
        </div>
        <div class="grid gap-1 sm:grid-cols-3 sm:gap-4">
          <h3 class="text-sm font-bold">Languages</h3>
          <p class="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:col-span-2">{{ profile.languages.join(' · ') }}</p>
        </div>
      </div>
    </section>

    <section class="scroll-mt-24 grid gap-5 border-t-2 border-slate-900 py-8 md:grid-cols-12 md:gap-12 dark:border-slate-800" aria-labelledby="notes-title">
      <div class="md:col-span-4">
        <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Notes</p>
        <h2 id="notes-title" class="max-w-xs text-2xl font-bold leading-tight tracking-tight">Thinking out loud.</h2>
      </div>
      <div
        class="flex flex-col gap-5 md:col-span-8 md:flex-row md:items-end md:justify-between"
        role="region"
        aria-roledescription="carousel"
        aria-label="Latest notes"
        @keydown.left.prevent="previousNote"
        @keydown.right.prevent="nextNote"
      >
        <div class="min-w-0 flex-1" aria-live="polite" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
          <article v-if="currentPost" role="group" aria-roledescription="slide" :aria-label="`${current + 1} of ${noteCount}`">
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatPostDate(currentPost.date) }} <span class="px-1">·</span> {{ currentPost.readTime }}</p>
            <h3 class="my-2 text-xl font-bold tracking-tight"><NuxtLink class="hover:text-blue-900 dark:hover:text-blue-200" :to="currentPost.path">{{ currentPost.title }}</NuxtLink></h3>
            <p class="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">{{ currentPost.summary }}</p>
          </article>
        </div>
        <div class="flex w-full items-center justify-between gap-4 md:w-auto md:flex-col md:items-end">
          <p class="font-mono text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">{{ String(current + 1).padStart(2, '0') }} / {{ String(noteCount).padStart(2, '0') }}</p>
          <div class="flex gap-2">
            <button class="grid size-9 place-items-center rounded-md border-2 border-slate-900 text-blue-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:text-blue-200 dark:hover:bg-slate-800" type="button" aria-label="Previous note" @click="previousNote"><Icon name="lucide:arrow-left" class="size-4" aria-hidden="true" /></button>
            <button class="grid size-9 place-items-center rounded-md border-2 border-slate-900 text-blue-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:text-blue-200 dark:hover:bg-slate-800" type="button" aria-label="Next note" @click="nextNote"><Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" /></button>
          </div>
          <NuxtLink class="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:underline dark:text-blue-200" to="/blog">All notes <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" /></NuxtLink>
        </div>
      </div>
    </section>

    <section class="mt-2 border-2 border-slate-900 bg-slate-50 p-6 shadow-hard-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-hard-lg-dark max-sm:p-5" aria-labelledby="contact-title">
      <p class="mb-3 text-sm font-bold text-blue-900 dark:text-blue-200">Get in touch</p>
      <h2 id="contact-title" class="mb-4 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Have a research or engineering problem in mind?</h2>
      <a class="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:underline dark:text-blue-200" :href="`mailto:${profile.email}`">{{ profile.email }} <Icon name="lucide:arrow-up-right" class="size-4" aria-hidden="true" /></a>
    </section>
  </div>
</template>
