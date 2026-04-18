import React, { useState, useCallback } from 'react'
import { render, Box, Text, useApp } from 'ink'
import TextInput from 'ink-text-input'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { route, parseSchema, prompt } from '../../../src/lib-core/index.js'
import { renderers } from './renderers/index.js'

const systemPrompt = prompt(renderers)

type Block = ReturnType<typeof route>[number]

interface Message {
  role: 'user' | 'assistant'
  blocks: Block[]
}

function RenderedBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <Box flexDirection="column" gap={0}>
      {blocks.map((block, i) => {
        if (!block.renderer) {
          return (
            <Box key={i} flexDirection="column">
              {block.markdown.split('\n').map((line, j) => (
                <Text key={j}>{line}</Text>
              ))}
            </Box>
          )
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Component = block.renderer.component as React.ComponentType<any>
        const props = parseSchema(block.markdown, block.renderer.schema)
        return <Component key={i} {...props} />
      })}
    </Box>
  )
}

function App() {
  const { exit } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()

  const handleSubmit = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (trimmed === '/exit' || trimmed === '/quit') { exit(); return }

    setInput('')
    setLoading(true)

    const userBlocks: Block[] = [{ renderer: null, markdown: trimmed }]
    setMessages((prev) => [...prev, { role: 'user', blocks: userBlocks }])

    try {
      let resultText = ''
      let newSessionId = sessionId

      for await (const message of query({
        prompt: trimmed,
        options: {
          maxTurns: 1,
          resume: sessionId,
          systemPrompt: {
            type: 'preset',
            preset: 'claude_code',
            append: systemPrompt,
          },
        },
      })) {
        if (message.type === 'system' && message.subtype === 'init') {
          const id = (message as Record<string, unknown>).session_id
          if (typeof id === 'string') newSessionId = id
        }
        if ('result' in message && message.result) {
          resultText = message.result
        }
      }

      if (newSessionId) setSessionId(newSessionId)

      const blocks = resultText
        ? route(resultText, renderers)
        : [{ renderer: null, markdown: '(no response)' }]

      setMessages((prev) => [...prev, { role: 'assistant', blocks }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', blocks: [{ renderer: null, markdown: `Error: ${msg}` }] },
      ])
    }

    setLoading(false)
  }, [sessionId, exit])

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">aimd TUI</Text>
        <Text dimColor>  /exit to quit</Text>
      </Box>

      {messages.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
            {msg.role === 'user' ? '▶ You' : '◀ Claude'}
          </Text>
          <Box marginLeft={2}>
            <RenderedBlocks blocks={msg.blocks} />
          </Box>
        </Box>
      ))}

      {loading && (
        <Box marginBottom={1}>
          <Text color="yellow">⠋ </Text>
          <Text dimColor>Thinking...</Text>
        </Box>
      )}

      {!loading && (
        <Box>
          <Text color="green">▶ </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type a message..."
          />
        </Box>
      )}
    </Box>
  )
}

render(<App />)
