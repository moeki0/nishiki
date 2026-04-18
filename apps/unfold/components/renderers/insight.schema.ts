import { g } from '@moeki0/gengen'

export const insightSchema = g.block('insight', {
  description: 'How this historical topic connects to the present day. Output as a blockquote (> ...).',
  schema: {
    note: g.blockquote(),
  },
})
