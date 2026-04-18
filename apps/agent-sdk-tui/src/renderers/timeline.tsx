import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

function TimelineRenderer({ items }: { items: { year: string; event: string }[] }) {
  return (
    <Box flexDirection="column">
      {items.map(({ year, event }, i) => (
        <Box key={i} flexDirection="column">
          <Box gap={1}>
            <Text color="yellow" bold>{year}</Text>
            <Text dimColor>{'─'.repeat(2)}</Text>
            <Text>{event}</Text>
          </Box>
          {i < items.length - 1 && (
            <Box marginLeft={2}>
              <Text dimColor>│</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

const timeline = g.block('timeline')
  .describe('Display a chronological timeline. Output ONLY a bullet list with "YYYY: event description" format. No headings, no extra markdown.')
  .schema({
    items: g.list().min(2).all(g.split(': ', g.yearStr('year'), g.str('event'))),
  })
  .component(TimelineRenderer)

export default timeline
