import { g } from '@moeki0/gengen'

export const quizSchema = g.block('quiz', {
  description: 'A quiz question. Write a heading "クイズ" or "quiz", then the question as a paragraph, then choices as a bullet list. Mark the correct answer by appending ★.',
  schema: {
    label: g.heading([2, 3]).content(/^(クイズ|quiz)$/i),
    question: g.text(),
    choices: g.list(3).some(g.endsWith('★').is('answer')),
  },
})
