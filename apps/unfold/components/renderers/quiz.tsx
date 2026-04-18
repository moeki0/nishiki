'use client'

import { useState } from 'react'
import { g } from '@moeki0/gengen'
import { useInlineText } from '@moeki0/gengen/react'
import { quizSchema } from './quiz.schema'

function QuizRenderer({ question, choices, answer }: { label: string; question: string; choices: string[]; answer: string }) {
  const inlineText = useInlineText()
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (choice: string) => {
    if (revealed) return
    setSelected(choice)
    setRevealed(true)
  }

  // ★マーカーを表示用テキストから除去
  const cleanChoice = (c: string) => c.replace(/★$/, '').trim()

  return (
    <div style={{ margin: '0.75rem 0', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '0.75rem' }}>
      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '0.75rem', fontFamily: 'var(--font-sans)' }}>クイズ</p>
      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111', marginBottom: '1rem', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>{inlineText(question)}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {choices.map((choice, i) => {
          const isCorrect = choice === answer
          const isSelected = choice === selected
          let bg = '#fafafa'
          let border = '1px solid #e8e8e8'
          let color = '#333'
          if (revealed && isCorrect) { bg = '#f0fdf4'; border = '1px solid #86efac'; color = '#166534' }
          else if (revealed && isSelected) { bg = '#fef2f2'; border = '1px solid #fca5a5'; color = '#991b1b' }
          else if (revealed) { color = '#aaa' }

          return (
            <button
              key={i}
              onClick={() => handleSelect(choice)}
              style={{
                textAlign: 'left', background: bg, border, borderRadius: '6px',
                padding: '0.6rem 0.875rem', fontSize: '0.875rem', color,
                cursor: revealed ? 'default' : 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
            >
              {revealed && isCorrect && '✓ '}
              {revealed && isSelected && !isCorrect && '✗ '}
              {inlineText(cleanChoice(choice))}
            </button>
          )
        })}
      </div>
      {!revealed && (
        <p style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '0.75rem', fontFamily: 'var(--font-sans)' }}>選択肢をクリックして答えを確認</p>
      )}
    </div>
  )
}

export default g.block('quiz', {
  ...quizSchema,
  component: QuizRenderer,
})
