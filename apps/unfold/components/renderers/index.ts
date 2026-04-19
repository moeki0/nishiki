import { g } from '@moeki0/gengen'
import timelineRenderer from './timeline'
import peopleRenderer from './people'
import insightRenderer from './insight'
import statsRenderer from './stats'
import calloutRenderer from './callout'
import quizRenderer from './quiz'
import countryRenderer from './country'
import eventRenderer from './event'
import pullquoteRenderer from './pullquote'
import compareRenderer from './compare'
import termcardRenderer from './termcard'
import bignumRenderer from './bignum'
import sourceRenderer from './source'
import agelineRenderer from './ageline'
import roleplayRenderer from './roleplay'
import whatifRenderer from './whatif'
import animapRenderer from './animap'

// event and country BEFORE people (people's g.list(1) would match anything otherwise)
export const blockRenderers = [
  eventRenderer, countryRenderer,
  compareRenderer, animapRenderer,
  timelineRenderer, statsRenderer, quizRenderer,
  pullquoteRenderer, bignumRenderer, sourceRenderer,
  agelineRenderer, roleplayRenderer, whatifRenderer,
  termcardRenderer,
  peopleRenderer, insightRenderer, calloutRenderer,
]

export { timelineSchema } from './timeline.schema'
export { eventSchema } from './event.schema'
export { peopleSchema } from './people.schema'
export { insightSchema } from './insight.schema'
export { statsSchema } from './stats.schema'
export { calloutSchema } from './callout.schema'
export { quizSchema } from './quiz.schema'
export { countrySchema } from './country.schema'
export { pullquoteSchema } from './pullquote.schema'
export { compareSchema } from './compare.schema'
export { termcardSchema } from './termcard.schema'
export { bignumSchema } from './bignum.schema'
export { sourceSchema } from './source.schema'
export { agelineSchema } from './ageline.schema'
export { roleplaySchema } from './roleplay.schema'
export { whatifSchema } from './whatif.schema'
export { animapSchema } from './animap.schema'

export const sectionHeading = g.heading(2)

export const deepdiveInline = g.inline('deepdive', {
  marker: ['[[', ']]'],
  description: 'A historical term worth exploring deeper. The reader can click it to learn more.',
})

export const boldInline = g.inline('bold', {
  marker: ['**', '**'],
  description: 'Emphasize a key phrase, name, or concept that the reader should pay attention to.',
})

export const footnoteInline = g.inline('footnote', {
  marker: ['[^', ']'],
  description: '引用・年号・固有名詞・数値など、正確性に自信がない箇所に付ける脚注番号。記事全体で通し番号にする。例: 1853年[^1]に来航し、4隻の艦隊[^2]を率いて。注意: 末尾に [^1]: ... のような注釈本文は書かないこと。マーカーのみ埋め込む。',
})
