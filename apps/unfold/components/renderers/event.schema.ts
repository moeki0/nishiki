import { g } from '@moeki0/gengen'

export const eventSchema = g.block('event', {
  description: 'Key events with years. Write a heading "event", then list as "name: year".',
  schema: {
    heading: g.heading([2, 3]).content(/^(event|イベント|年代|時代)$/i),
    events: g.list(1).all(g.split(/[：:]\s*/, g.str('name'), g.str('year'))),
  },
})
