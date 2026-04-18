import { g } from '@moeki0/gengen'

export const relatedSchema = g.block('related', {
  description: 'Related historical topics worth exploring next. Short topic names only.',
  schema: {
    topics: g.list(2),
  },
})
