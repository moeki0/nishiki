import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

function DiffRenderer({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          return (
            <Box key={i} gap={0}>
              <Text color="green" bold>+</Text>
              <Text color="green">{line.slice(1)}</Text>
            </Box>
          )
        }
        if (line.startsWith('-') && !line.startsWith('---')) {
          return (
            <Box key={i} gap={0}>
              <Text color="red" bold>-</Text>
              <Text color="red">{line.slice(1)}</Text>
            </Box>
          )
        }
        if (line.startsWith('@@')) {
          return <Text key={i} color="cyan">{line}</Text>
        }
        if (line.startsWith('---') || line.startsWith('+++')) {
          return <Text key={i} dimColor>{line}</Text>
        }
        return <Text key={i} dimColor>{line}</Text>
      })}
    </Box>
  )
}

const diff = g.block('diff')
  .describe('Display a unified diff. Use a ```diff code block with standard unified diff format.')
  .schema({
    content: g.codeblock('diff'),
  })
  .component(DiffRenderer)

export default diff
