import { g } from '@moeki0/gengen'

export const calloutSchema = g.block('callout', {
  description: 'A key insight or important point to highlight. Output as a blockquote (> ...).',
  schema: {
    note: g.blockquote(),
  },
})
