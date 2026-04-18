import { g } from '@moeki0/gengen'

export const countrySchema = g.block('country', {
  description: 'Countries/regions involved. Write a heading "country" then list country names in Japanese.',
  schema: {
    heading: g.heading([2, 3]).content(/^(country|国|地域|舞台)$/i),
    countries: g.list(1),
  },
})
