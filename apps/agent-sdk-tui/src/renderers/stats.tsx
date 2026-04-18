import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

function StatsRenderer({ items }: { items: { label: string; value: string }[] }) {
  const labelWidth = Math.max(...items.map((s) => s.label.length))

  return (
    <Box flexDirection="column">
      {items.map(({ label, value }, i) => (
        <Box key={i} gap={2}>
          <Text color="gray">{label.padEnd(labelWidth)}</Text>
          <Text bold color="cyan">{value}</Text>
        </Box>
      ))}
    </Box>
  )
}

const stats = g.block('stats')
  .describe('Display key-value statistics. Output ONLY a bullet list with "Label: Value" format. No headings, no extra markdown.')
  .schema({
    items: g.list().min(2).all(g.split(': ', g.str('label'), g.str('value'))),
  })
  .component(StatsRenderer)

export default stats
