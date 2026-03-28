import { useState } from 'react'
import { App } from 'antd'
import { useTranslation } from 'react-i18next'

import { useAnswerQuestion, useAskQuestion, useItemQuestions } from '@/features/item/api'
import { formatRelativeTime } from '@/utils/format'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const PAGE_SIZE_STEP = 5

interface PendingQuestion {
  id: string
  question: string
  createdAt: string
}

interface ItemQAProps {
  itemId: string
  isSeller?: boolean
  realtimeConnected?: boolean
  lastSyncedAt?: number | null
}

export function ItemQA({
  itemId,
  isSeller = false,
  realtimeConnected = false,
  lastSyncedAt = null,
}: ItemQAProps) {
  const { t, i18n } = useTranslation('item')
  const { message } = App.useApp()
  const isVi = i18n.language === 'vi'

  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP)
  const [newQuestion, setNewQuestion] = useState('')
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([])
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null)

  const {
    data: questionsData,
    isLoading,
    isFetching,
  } = useItemQuestions(
    itemId,
    { pageNumber: 1, pageSize },
    { refetchInterval: realtimeConnected ? false : 60000 },
  )
  const askQuestion = useAskQuestion()
  const answerQuestion = useAnswerQuestion()

  const questions = questionsData?.items ?? []
  const canLoadMore = Boolean(questionsData?.metadata.hasNext)
  const lastSyncedLabel = lastSyncedAt ? formatRelativeTime(new Date(lastSyncedAt).toISOString()) : null

  const handleAskQuestion = async () => {
    const question = newQuestion.trim()
    if (!question) {
      return
    }

    const optimisticQuestion: PendingQuestion = {
      id: `pending-${Date.now()}`,
      question,
      createdAt: new Date().toISOString(),
    }

    setPendingQuestions((prev) => [optimisticQuestion, ...prev])
    setNewQuestion('')

    try {
      await askQuestion.mutateAsync({ itemId, question })
      setPendingQuestions((prev) => prev.filter((entry) => entry.id !== optimisticQuestion.id))
      message.success(t('questionAsked', 'Câu hỏi đã được gửi'))
    } catch {
      setPendingQuestions((prev) => prev.filter((entry) => entry.id !== optimisticQuestion.id))
      setNewQuestion(question)
      message.error(t('questionError', 'Không thể gửi câu hỏi'))
    }
  }

  const handleAnswer = async (questionId: string) => {
    const answer = answerText[questionId]?.trim()
    if (!answer) {
      return
    }

    setAnsweringQuestionId(questionId)

    try {
      await answerQuestion.mutateAsync({ itemId, questionId, answer })
      setAnswerText((prev) => ({ ...prev, [questionId]: '' }))
      message.success(t('answerPosted', 'Câu trả lời đã được đăng'))
    } catch {
      message.error(t('answerError', 'Không thể đăng câu trả lời'))
    } finally {
      setAnsweringQuestionId(null)
    }
  }

  return (
    <div style={{ marginTop: 48 }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h3
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: headingFont,
            fontSize: 22,
            fontWeight: headingWeight,
            margin: 0,
          }}
        >
          {t('qna', 'Hỏi & Đáp')}
        </h3>
        <div
          style={{
            alignItems: 'center',
            color: 'var(--color-text-secondary)',
            display: 'inline-flex',
            fontFamily: SANS_FONT,
            fontSize: 12,
            gap: 8,
          }}
        >
          <span
            style={{
              background: realtimeConnected ? 'var(--color-success)' : 'var(--color-text-tertiary)',
              borderRadius: '50%',
              display: 'inline-block',
              height: 8,
              width: 8,
            }}
          />
          <span>
            {realtimeConnected
              ? t('realtimeLive', 'Realtime đang hoạt động')
              : t('realtimeFallback', 'Đang dùng làm mới định kỳ')}
          </span>
          {lastSyncedLabel && (
            <span>
              {t('lastSynced', 'Cập nhật {{time}}', { time: lastSyncedLabel })}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            color: 'var(--color-text-secondary)',
            fontFamily: SANS_FONT,
            fontSize: 14,
            padding: 40,
            textAlign: 'center',
          }}
        >
          {t('loading', 'Đang tải...')}
        </div>
      ) : questions.length === 0 && pendingQuestions.length === 0 ? (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 2,
            color: 'var(--color-text-secondary)',
            fontFamily: SANS_FONT,
            fontSize: 14,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          {t('noQuestions', 'Chưa có câu hỏi nào')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendingQuestions.map((question) => (
            <div
              key={question.id}
              style={{
                background: 'rgba(196, 147, 61, 0.05)',
                border: '1px dashed rgba(196, 147, 61, 0.45)',
                borderRadius: 2,
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    alignItems: 'center',
                    background: 'var(--color-accent-light)',
                    borderRadius: '50%',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    flexShrink: 0,
                    fontSize: 14,
                    height: 32,
                    justifyContent: 'center',
                    width: 32,
                  }}
                >
                  Q
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: SANS_FONT,
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {question.question}
                  </p>
                  <span
                    style={{
                      color: 'var(--color-text-tertiary)',
                      display: 'block',
                      fontFamily: SANS_FONT,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {t('pendingQuestion', 'Đang gửi...')} • {formatRelativeTime(question.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {questions.map((question) => (
            <div
              key={question.id}
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 2,
                padding: '20px 24px',
              }}
            >
              <div style={{ alignItems: 'flex-start', display: 'flex', gap: 12 }}>
                <div
                  style={{
                    alignItems: 'center',
                    background: 'var(--color-accent-light)',
                    borderRadius: '50%',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    flexShrink: 0,
                    fontSize: 14,
                    height: 32,
                    justifyContent: 'center',
                    width: 32,
                  }}
                >
                  Q
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: SANS_FONT,
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {question.question}
                  </p>
                  <span
                    style={{
                      color: 'var(--color-text-tertiary)',
                      display: 'block',
                      fontFamily: SANS_FONT,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {formatRelativeTime(question.createdAt)}
                  </span>
                </div>
              </div>

              {question.answer ? (
                <div
                  style={{
                    alignItems: 'flex-start',
                    borderTop: '1px solid var(--color-border-light)',
                    display: 'flex',
                    gap: 12,
                    marginTop: 16,
                    paddingTop: 16,
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      background: 'rgba(74, 124, 89, 0.1)',
                      borderRadius: '50%',
                      color: 'var(--color-success)',
                      display: 'flex',
                      flexShrink: 0,
                      fontSize: 14,
                      height: 32,
                      justifyContent: 'center',
                      width: 32,
                    }}
                  >
                    A
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        color: 'var(--color-text-primary)',
                        fontFamily: SANS_FONT,
                        fontSize: 14,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {question.answer}
                    </p>
                    {question.answeredAt && (
                      <span
                        style={{
                          color: 'var(--color-text-tertiary)',
                          display: 'block',
                          fontFamily: SANS_FONT,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {formatRelativeTime(question.answeredAt)}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    borderTop: '1px solid var(--color-border-light)',
                    marginTop: 16,
                    paddingTop: 16,
                  }}
                >
                  {isSeller ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={answerText[question.id] ?? ''}
                        onChange={(event) =>
                          setAnswerText((prev) => ({
                            ...prev,
                            [question.id]: event.target.value,
                          }))
                        }
                        placeholder={t('answerPlaceholder', 'Nhập câu trả lời...')}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            void handleAnswer(question.id)
                          }
                        }}
                        style={{
                          background: 'var(--color-bg-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 2,
                          color: 'var(--color-text-primary)',
                          flex: 1,
                          fontFamily: SANS_FONT,
                          fontSize: 14,
                          outline: 'none',
                          padding: '8px 12px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void handleAnswer(question.id)
                        }}
                        disabled={answeringQuestionId === question.id || !answerText[question.id]?.trim()}
                        style={{
                          background: 'var(--color-accent)',
                          border: 'none',
                          borderRadius: 2,
                          color: '#fff',
                          cursor: 'pointer',
                          fontFamily: SANS_FONT,
                          fontSize: 14,
                          fontWeight: 500,
                          opacity:
                            answeringQuestionId === question.id || !answerText[question.id]?.trim()
                              ? 0.5
                              : 1,
                          padding: '8px 20px',
                        }}
                      >
                        {answeringQuestionId === question.id
                          ? t('answering', 'Đang gửi...')
                          : t('answer', 'Trả lời')}
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{
                        color: 'var(--color-text-tertiary)',
                        fontFamily: SANS_FONT,
                        fontSize: 13,
                        fontStyle: 'italic',
                      }}
                    >
                      {t('noAnswer', 'Chưa trả lời')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canLoadMore && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setPageSize((prev) => prev + PAGE_SIZE_STEP)}
            disabled={isFetching}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 2,
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 500,
              opacity: isFetching ? 0.6 : 1,
              padding: '10px 18px',
            }}
          >
            {isFetching ? t('loadingMore', 'Đang tải thêm...') : t('loadMore', 'Xem thêm câu hỏi')}
          </button>
        </div>
      )}

      {!isSeller && (
        <div
          style={{
            background: 'var(--color-bg-surface)',
            borderRadius: 2,
            marginTop: 24,
            padding: '20px 24px',
          }}
        >
          <label
            style={{
              color: 'var(--color-text-secondary)',
              display: 'block',
              fontFamily: SANS_FONT,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {t('askLabel', 'Đặt câu hỏi')}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newQuestion}
              onChange={(event) => setNewQuestion(event.target.value)}
              placeholder={t('askPlaceholder', 'Hỏi về sản phẩm này...')}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleAskQuestion()
                }
              }}
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 2,
                color: 'var(--color-text-primary)',
                flex: 1,
                fontFamily: SANS_FONT,
                fontSize: 14,
                outline: 'none',
                padding: '10px 14px',
              }}
            />
            <button
              type="button"
              onClick={() => {
                void handleAskQuestion()
              }}
              disabled={askQuestion.isPending || !newQuestion.trim()}
              className="oio-press"
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: 2,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: SANS_FONT,
                fontSize: 14,
                fontWeight: 500,
                opacity: askQuestion.isPending || !newQuestion.trim() ? 0.5 : 1,
                padding: '10px 24px',
              }}
            >
              {askQuestion.isPending ? t('sending', 'Đang gửi...') : t('ask', 'Gửi')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
