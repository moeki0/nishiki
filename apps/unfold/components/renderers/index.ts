import { g } from '@moeki0/gengen'
import timelineRenderer from './timeline'
import peopleRenderer from './people'
import insightRenderer from './insight'
import statsRenderer from './stats'
import calloutRenderer from './callout'
import quizRenderer from './quiz'
import countryRenderer from './country'
import eventRenderer from './event'

// event and country BEFORE people (people's g.list(1) would match anything otherwise)
export const blockRenderers = [eventRenderer, countryRenderer, timelineRenderer, statsRenderer, quizRenderer, peopleRenderer, insightRenderer, calloutRenderer]

export { timelineSchema } from './timeline.schema'
export { eventSchema } from './event.schema'
export { peopleSchema } from './people.schema'
export { insightSchema } from './insight.schema'
export { statsSchema } from './stats.schema'
export { calloutSchema } from './callout.schema'
export { quizSchema } from './quiz.schema'
export { countrySchema } from './country.schema'

export const sectionHeading = g.heading(2)
// no splits — plain ## heading text

export const deepdiveInline = g.inline('deepdive', {
  marker: ['[[', ']]'],
  description: 'A historical term worth exploring deeper. The reader can click it to learn more.',
})

export const boldInline = g.inline('bold', {
  marker: ['**', '**'],
  description: 'Emphasize a key phrase, name, or concept that the reader should pay attention to.',
})
