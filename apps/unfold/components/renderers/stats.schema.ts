import { g } from '@moeki0/gengen'

export const statsSchema = g.block('stats', {
  description: 'Key numbers and statistics. Each item: "label: value" (e.g. "死者数: 約40,000人").',
  schema: {
    items: g.list(1).all(g.split(/[：:]\s*/, g.str('label'), g.str('value'))),
  },
})
