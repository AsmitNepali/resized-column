import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const createLinkSchema = () => z.object({
  label: z.string().nonempty(),
  to: z.string().nonempty(),
  icon: z.string().optional(),
  trailingIcon: z.string().optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  trailing: z.boolean().optional(),
  target: z.enum(['_blank', '_self']).optional(),
  color: z.enum(['primary', 'secondary', 'neutral', 'error', 'warning', 'success', 'info']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link']).optional()
})

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        hero: z.object({
          headline: z.string().optional(),
          links: z.array(createLinkSchema())
        }),
        terminal: z.object({
          lines: z.array(z.object({
            segments: z.array(z.object({
              text: z.string(),
              style: z.string()
            }))
          }))
        }),
        logos: z.object({
          title: z.string().nonempty(),
          items: z.array(z.string())
        }),
        features: z.object({
          headline: z.string().optional(),
          title: z.string().nonempty(),
          description: z.string().nonempty(),
          items: z.array(z.object({
            icon: z.string(),
            title: z.string().nonempty(),
            description: z.string().nonempty()
          }))
        }),
        metrics: z.object({
          headline: z.string().optional(),
          title: z.string().nonempty(),
          description: z.string().nonempty(),
          items: z.array(z.object({
            value: z.string().nonempty(),
            label: z.string().nonempty(),
            class: z.string().nonempty()
          }))
        }),
        cta: z.object({
          title: z.string().nonempty(),
          description: z.string().nonempty(),
          command: z.string().nonempty(),
          links: z.array(createLinkSchema())
        })
      })
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**',
        exclude: ['index.yml', 'index.md']
      },
      schema: z.object({
        links: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional()
        })).optional()
      })
    })
  }
})
