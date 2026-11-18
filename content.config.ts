import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        category: z.string(),
        readTime: z.string(),
        summary: z.string(),
        intro: z.string(),
        coverImage: z.object({
          url: z.string(),
          alt: z.string(),
          width: z.number(),
          height: z.number(),
          mimeType: z.enum(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']),
        }),
        relatedPublicationUrls: z.array(z.string()).optional(),
        series: z
          .object({
            title: z.string(),
            part: z.number(),
            total: z.number(),
            repositoryUrl: z.string(),
            sourceFiles: z.array(z.string()),
            previousSlug: z.string().optional(),
            nextSlug: z.string().optional(),
            discussionEmail: z.string().optional(),
          })
          .optional(),
        references: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
      }),
    }),
  },
})
