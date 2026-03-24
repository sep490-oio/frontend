import { useState } from 'react'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'
import { useItemQuestions, useAskQuestion, useAnswerQuestion } from '@/features/item/api'
import { formatRelativeTime } from '@/utils/format'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"

interface ItemQAProps {
  itemId: string
  isSeller?: boolean
}

export function ItemQA({ itemId, isSeller = false }: ItemQAProps) {
  const { t, i18n } = useTranslation('item')
  const { message } = App.useApp()
  const isVi = i18n.language === 'vi'

  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  const { data: questionsData, isLoading } = useItemQuestions(itemId)
  const askQuestion = useAskQuestion()
  const answerQuestion = useAnswerQuestion()

  const [newQuestion, setNewQuestion] = useState('')
  const [answerText, setAnswerText] = useState<Record<string, string>>({})

  const questions = questionsData?.items ?? []

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return
    try {
      await askQuestion.mutateAsync({ itemId, question: newQuestion.trim() })
      setNewQuestion('')
      message.success(t('questionAsked', 'C\u00e2u h\u1ecfi \u0111\u00e3 \u0111\u01b0\u1ee3c g\u1eedi'))
    } catch {
      message.error(t('questionError', 'Kh\u00f4ng th\u1ec3 g\u1eedi c\u00e2u h\u1ecfi'))
    }
  }

  const handleAnswer = async (questionId: string) => {
    const text = answerText[questionId]?.trim()
    if (!text) return
    try {
      await answerQuestion.mutateAsync({ itemId, questionId, answer: text })
      setAnswerText((prev) => ({ ...prev, [questionId]: '' }))
      message.success(t('answerPosted', 'C\u00e2u tr\u1ea3 l\u1eddi \u0111\u00e3 \u0111\u01b0\u1ee3c \u0111\u0103ng'))
    } catch {
      message.error(t('answerError', 'Kh\u00f4ng th\u1ec3 \u0111\u0103ng c\u00e2u tr\u1ea3 l\u1eddi'))
    }
  }

  return (
    <div style={{ marginTop: 48 }}>
      <h3
        style={{
          fontFamily: headingFont,
          fontSize: 22,
          fontWeight: headingWeight,
          color: 'var(--color-text-primary)',
          marginBottom: 24,
        }}
      >
        {t('qna', 'H\u1ecfi & \u0110\u00e1p')}
      </h3>

      {/* Questions list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)', fontFamily: SANS_FONT, fontSize: 14 }}>
          {t('loading', '\u0110ang t\u1ea3i...')}
        </div>
      ) : questions.length === 0 ? (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontFamily: SANS_FONT,
            fontSize: 14,
            background: 'var(--color-bg-surface)',
            borderRadius: 2,
          }}
        >
          {t('noQuestions', 'Ch\u01b0a c\u00f3 c\u00e2u h\u1ecfi n\u00e0o')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 2,
                padding: '20px 24px',
              }}
            >
              {/* Question */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--color-accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 14,
                    color: 'var(--color-accent)',
                  }}
                >
                  Q
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'var(--color-text-primary)',
                      margin: 0,
                    }}
                  >
                    {q.question}
                  </p>
                  <span
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 12,
                      color: 'var(--color-text-tertiary)',
                      marginTop: 4,
                      display: 'block',
                    }}
                  >
                    {formatRelativeTime(q.createdAt)}
                  </span>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border-light)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(74, 124, 89, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      color: 'var(--color-success)',
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: 'var(--color-text-primary)',
                        margin: 0,
                      }}
                    >
                      {q.answer}
                    </p>
                    {q.answeredAt && (
                      <span
                        style={{
                          fontFamily: SANS_FONT,
                          fontSize: 12,
                          color: 'var(--color-text-tertiary)',
                          marginTop: 4,
                          display: 'block',
                        }}
                      >
                        {formatRelativeTime(q.answeredAt)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--color-border-light)',
                  }}
                >
                  {isSeller ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={answerText[q.id] ?? ''}
                        onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={t('answerPlaceholder', 'Nh\u1eadp c\u00e2u tr\u1ea3 l\u1eddi...')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAnswer(q.id)
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: 2,
                          fontFamily: SANS_FONT,
                          fontSize: 14,
                          background: 'var(--color-bg-surface)',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAnswer(q.id)}
                        disabled={answerQuestion.isPending || !answerText[q.id]?.trim()}
                        style={{
                          padding: '8px 20px',
                          background: 'var(--color-accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 2,
                          fontFamily: SANS_FONT,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: 'pointer',
                          opacity: answerQuestion.isPending || !answerText[q.id]?.trim() ? 0.5 : 1,
                        }}
                      >
                        {t('answer', 'Tr\u1ea3 l\u1eddi')}
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: 13,
                        color: 'var(--color-text-tertiary)',
                        fontStyle: 'italic',
                      }}
                    >
                      {t('noAnswer', 'Ch\u01b0a tr\u1ea3 l\u1eddi')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ask question form */}
      {!isSeller && (
        <div
          style={{
            marginTop: 24,
            padding: '20px 24px',
            background: 'var(--color-bg-surface)',
            borderRadius: 2,
          }}
        >
          <label
            style={{
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              display: 'block',
            }}
          >
            {t('askLabel', '\u0110\u1eb7t c\u00e2u h\u1ecfi')}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t('askPlaceholder', 'H\u1ecfi v\u1ec1 s\u1ea3n ph\u1ea9m n\u00e0y...')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskQuestion()
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                fontFamily: SANS_FONT,
                fontSize: 14,
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleAskQuestion}
              disabled={askQuestion.isPending || !newQuestion.trim()}
              className="oio-press"
              style={{
                padding: '10px 24px',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 2,
                fontFamily: SANS_FONT,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: askQuestion.isPending || !newQuestion.trim() ? 0.5 : 1,
              }}
            >
              {t('ask', 'G\u1eedi')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
