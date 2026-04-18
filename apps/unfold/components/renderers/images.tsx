'use client'

import { g } from '@moeki0/gengen'
import { imagesSchema } from './images.schema'

function ImagesRenderer({ images }: { images: string[] }) {
  const parsed = images.map((item) => {
    const [url, ...rest] = item.split('—')
    return { url: url.trim(), caption: rest.join('—').trim() }
  })

  return (
    <div className="my-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-4">画像</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {parsed.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-lg border border-stone-200">
            <img
              src={img.url}
              alt={img.caption}
              className="w-full h-36 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            {img.caption && (
              <figcaption className="px-2 py-1.5 text-xs text-stone-500 leading-snug">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  )
}

export default g.block('images', {
  ...imagesSchema,
  component: ImagesRenderer,
})
