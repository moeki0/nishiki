import { g } from '@moeki0/gengen'

export const imagesSchema = g.block('images', {
  description: 'A collection of relevant images with captions. Each item: "URL — caption".',
  schema: {
    images: g.list(1),
  },
})
