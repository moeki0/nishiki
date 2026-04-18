import { g } from '@moeki0/gengen'

export const peopleSchema = g.block('people', {
  description: 'Key figures. Each item: "Name — role or one-line description". The — separator is required.',
  schema: {
    people: g.list(1).some(g.matches(/[—–\-]{1,2}/)),
  },
})
