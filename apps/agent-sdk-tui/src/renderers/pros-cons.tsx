import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

function ProsConsRenderer({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <Box gap={4}>
      <Box flexDirection="column">
        <Text bold color="green">Pros</Text>
        {pros.map((item, i) => (
          <Box key={i} gap={1}>
            <Text color="green">✓</Text>
            <Text>{item}</Text>
          </Box>
        ))}
      </Box>
      <Box flexDirection="column">
        <Text bold color="red">Cons</Text>
        {cons.map((item, i) => (
          <Box key={i} gap={1}>
            <Text color="red">✗</Text>
            <Text>{item}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const prosCons = g.block('pros-cons')
  .describe('Display pros and cons side by side. Output two bullet lists: first with pros (✓ prefix), then with cons (✗ prefix).')
  .schema({
    pros: g.list().having(g.startsWith('✓')),
    cons: g.list().having(g.startsWith('✗')),
  })
  .component(ProsConsRenderer)

export default prosCons
