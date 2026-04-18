import stats from './stats.js'
import timeline from './timeline.js'
import steps from './steps.js'
import prosCons from './pros-cons.js'
import tree from './tree.js'
import diff from './diff.js'
import type { RendererDefinition } from '../../../../src/lib-core/index.js'

// 特定性の高い順に並べる（greedyなものは後ろ）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderers: RendererDefinition<any>[] = [
  tree, diff, timeline, stats, prosCons, steps,
]
