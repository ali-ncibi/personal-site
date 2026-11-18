<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { profile } from '~/data/profile'

type Theme = 'light' | 'dark'

const theme = ref<Theme | null>(null)

function setTheme(nextTheme: Theme, persist = true) {
  theme.value = nextTheme
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  if (persist) {
    localStorage.setItem('ali-site-theme', nextTheme)
  }
}

function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('ali-site-theme')
  const initialTheme =
    savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

  setTheme(initialTheme, false)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
    <header class="sticky top-3 z-20 mx-auto w-full max-w-6xl px-5">
      <div class="mx-auto flex w-full items-center justify-between gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-2 shadow-hard-sm sm:gap-4 dark:border-slate-800 dark:bg-slate-950 dark:shadow-hard-sm-dark">
      <NuxtLink class="shrink-0 text-lg font-extrabold tracking-tighter sm:text-xl" to="/" aria-label="Ali Ncibi home">
        Ali <span class="text-blue-900 dark:text-blue-200">Ncibi</span>
      </NuxtLink>
      <nav class="flex min-w-0 flex-1 items-center justify-center gap-0 overflow-x-auto sm:gap-1" aria-label="Main navigation">
        <NuxtLink class="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent p-0 hover:border-slate-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2" to="/#about" aria-label="About"><Icon name="lucide:user-round" class="size-4" aria-hidden="true" /><span class="sr-only md:not-sr-only">About</span></NuxtLink>
        <NuxtLink class="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent p-0 hover:border-slate-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2" to="/#research" aria-label="Research"><Icon name="lucide:microscope" class="size-4" aria-hidden="true" /><span class="sr-only md:not-sr-only">Research</span></NuxtLink>
        <NuxtLink class="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent p-0 hover:border-slate-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2" to="/#projects" aria-label="Projects"><Icon name="lucide:folder-git-2" class="size-4" aria-hidden="true" /><span class="sr-only md:not-sr-only">Projects</span></NuxtLink>
        <NuxtLink class="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent p-0 hover:border-slate-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2" to="/#publications" aria-label="Publications"><Icon name="lucide:book-open-text" class="size-4" aria-hidden="true" /><span class="sr-only md:not-sr-only">Publications</span></NuxtLink>
        <NuxtLink class="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-transparent p-0 hover:border-slate-900 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:h-auto md:w-auto md:gap-2 md:px-3 md:py-2" to="/blog" aria-label="Notes"><Icon name="lucide:notebook-pen" class="size-4" aria-hidden="true" /><span class="sr-only md:not-sr-only">Notes</span></NuxtLink>
      </nav>
      <button
        class="grid size-9 shrink-0 place-items-center rounded-md border-2 border-slate-900 bg-blue-900 text-white shadow-hard-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-blue-200 dark:text-slate-950 dark:hover:bg-blue-100 dark:shadow-hard-sm-dark"
        type="button"
        :aria-label="theme ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : 'Toggle color theme'"
        :aria-pressed="theme === 'dark'"
        @click="toggleTheme"
      >
        <Icon :name="theme === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="size-4" aria-hidden="true" />
      </button>
      </div>
    </header>
    <main class="flex-1">
      <NuxtPage />
    </main>
    <footer class="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 border-t-4 border-slate-900 px-5 py-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
      <span class="basis-full sm:basis-auto">{{ profile.name }} · {{ profile.role }}</span>
      <a class="hover:text-blue-900 dark:hover:text-blue-200" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
      <span>© {{ new Date().getFullYear() }}</span>
    </footer>
  </div>
</template>
