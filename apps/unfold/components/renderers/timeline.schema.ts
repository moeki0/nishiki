import { g } from '@moeki0/gengen'

export const timelineSchema = g.block('timeline', {
  description: 'Key historical events in chronological order.',
  schema: {
    events: g.list().all(g.split(/[：:]\s*/, g.yearStr('year'), g.str('event'))),
  },
})
