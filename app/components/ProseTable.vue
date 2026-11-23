<script setup lang="ts">
// Override for Nuxt Content's default `prose-table` renderer.
// Wraps the table in a horizontally scrollable container so wide tables
// scroll internally on small screens instead of overflowing the page.
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
</script>

<template>
  <div class="nuxt-content-table-scroll">
    <table v-bind="attrs">
      <slot />
    </table>
  </div>
</template>
