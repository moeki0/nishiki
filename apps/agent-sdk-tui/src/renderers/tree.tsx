import React from 'react'
import { Box, Text } from 'ink'
import { g } from '../../../../packages/gengen/src/lib-core/server.js'

interface TreeNode {
  label: string
  depth: number
  isLast: boolean[]
}

function parseTree(raw: string): TreeNode[] {
  const lines = raw.split('\n').filter((l) => l.trim())
  return lines.map((line, i) => {
    const depth = Math.floor((line.match(/^(\s*)/)?.[1].length ?? 0) / 2)
    const label = line.trim().replace(/^[-*]\s*/, '')

    // determine if last at each depth level
    const isLast: boolean[] = []
    for (let d = 0; d <= depth; d++) {
      const remaining = lines.slice(i + 1)
      const nextAtDepth = remaining.findIndex((l) => {
        const ld = Math.floor((l.match(/^(\s*)/)?.[1].length ?? 0) / 2)
        return ld <= d
      })
      isLast[d] = nextAtDepth === -1 || Math.floor((remaining[nextAtDepth]?.match(/^(\s*)/)?.[1].length ?? 0) / 2) < d
    }

    return { label, depth, isLast }
  })
}

function TreeRenderer({ content }: { content: string }) {
  const nodes = parseTree(content)

  return (
    <Box flexDirection="column">
      {nodes.map((node, i) => {
        const prefix = node.isLast
          .slice(0, node.depth)
          .map((last) => (last ? '   ' : '│  '))
          .join('')
        const branch = node.depth === 0 ? '' : (node.isLast[node.depth] ? '└─ ' : '├─ ')

        return (
          <Box key={i}>
            <Text dimColor>{prefix}{branch}</Text>
            <Text color={node.depth === 0 ? 'cyan' : 'white'} bold={node.depth === 0}>
              {node.label}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}

const tree = g.block('tree')
  .describe('Display a hierarchical tree structure. Use a ```tree code block with indented items (2 spaces per level).')
  .schema({
    content: g.codeblock('tree'),
  })
  .component(TreeRenderer)

export default tree
