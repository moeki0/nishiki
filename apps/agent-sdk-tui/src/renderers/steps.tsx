import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

function StepsRenderer({ items }: { items: string[] }) {
  return (
    <Box flexDirection="column">
      {items.map((item, i) => (
        <Box key={i} flexDirection="column">
          <Box gap={1}>
            <Text bold color="cyan">{i + 1}.</Text>
            <Text>{item}</Text>
          </Box>
          {i < items.length - 1 && (
            <Box marginLeft={2}><Text dimColor>│</Text></Box>
          )}
        </Box>
      ))}
    </Box>
  )
}

const steps = g.block('steps')
  .describe('Display numbered step-by-step instructions. Output a bullet list of steps in order.')
  .schema({
    items: g.list().min(2),
  })
  .component(StepsRenderer)

export default steps
