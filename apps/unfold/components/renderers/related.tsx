'use client'

import { g } from '@moeki0/gengen'
import { useGengenContext } from '@moeki0/gengen/react'
import { relatedSchema } from './related.schema'

function RelatedRenderer({ topics }: { topics: string[] }) {
  const { onAction } = useGengenContext<{ onAction?: (a: { type: string; payload: string }) => void }>()
  return (
    <div className="my-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-3">関連テーマ</h2>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <button
            key={i}
            onClick={() => onAction?.({ type: 'navigate', payload: topic })}
            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  )
}

export default g.block('related', {
  ...relatedSchema,
  component: RelatedRenderer,
})
