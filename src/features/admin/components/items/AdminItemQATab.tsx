import { useState } from 'react'
import { Typography, Card, Button, Space, Spin, Modal, Input, App, Tag, Tooltip, Badge, Empty, Popconfirm, Avatar, Statistic, Row, Col } from 'antd'
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  WarningOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { useAdminItemQuestions, useHideItemQuestion, useShowItemQuestion, useFlagUser } from '@/features/admin/api'
import { formatDateTime } from '@/utils/format'
import { Link } from 'react-router'
import type { AdminItemQuestionDto } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { Text, Paragraph } = Typography

interface AdminItemQATabProps {
  itemId: string
}

export default function AdminItemQATab({ itemId }: AdminItemQATabProps) {
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const { data, isLoading, refetch } = useAdminItemQuestions(itemId)
  const hideQuestion = useHideItemQuestion()
  const showQuestion = useShowItemQuestion()
  const flagUser = useFlagUser()

  const [hideModal, setHideModal] = useState<{ questionId: string; askerId: string } | null>(null)
  const [hideReason, setHideReason] = useState('')
  const [warnModal, setWarnModal] = useState<{ userId: string; question: string } | null>(null)
  const [warnReason, setWarnReason] = useState('')

  const questions = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0
  const answeredCount = questions.filter((q: any) => q.answer).length
  const hiddenCount = questions.filter((q: any) => !q.isPublic).length

  const handleHide = async () => {
    if (!hideModal || !hideReason.trim()) return
    try {
      await hideQuestion.mutateAsync({ itemId, questionId: hideModal.questionId, reason: hideReason.trim() })
      message.success('Question hidden successfully')
      setHideModal(null)
      setHideReason('')
    } catch {
      message.error('Failed to hide question')
    }
  }

  const handleShow = async (questionId: string) => {
    try {
      await showQuestion.mutateAsync({ itemId, questionId })
      message.success('Question restored successfully')
    } catch {
      message.error('Failed to restore question')
    }
  }

  const handleWarn = async () => {
    if (!warnModal || !warnReason.trim()) return
    try {
      await flagUser.mutateAsync({
        userId: warnModal.userId,
        severity: 'low',
        reason: warnReason.trim(),
        flagType: 'qa_violation',
      })
      message.success('User warned successfully')
      setWarnModal(null)
      setWarnReason('')
    } catch {
      message.error('Failed to warn user')
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {/* Stats Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#e6f4ff' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Total Questions"
              value={totalCount}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: '#f6ffed' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Answered"
              value={answeredCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, background: hiddenCount > 0 ? '#fff2f0' : '#f5f5f5' }} bodyStyle={{ padding: 16 }}>
            <Statistic
              title="Hidden"
              value={hiddenCount}
              prefix={<EyeInvisibleOutlined />}
              valueStyle={{ color: hiddenCount > 0 ? '#ff4d4f' : '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Q&A Threads */}
      {questions.length === 0 ? (
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Empty
            image={<MessageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description="No questions have been asked for this item yet."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q: any) => (
            <QuestionThread
              key={q.id}
              question={q}
              isMobile={isMobile}
              onHide={() => setHideModal({ questionId: q.id, askerId: q.askerId })}
              onShow={() => handleShow(q.id)}
              onWarn={() => setWarnModal({ userId: q.askerId, question: q.question })}
              isShowLoading={showQuestion.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {data?.metadata?.hasNext && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type="link" onClick={() => refetch()}>
            Load more questions
          </Button>
        </div>
      )}

      {/* Hide Modal */}
      <Modal
        title={
          <Space>
            <EyeInvisibleOutlined style={{ color: '#ff4d4f' }} />
            <span>Hide Question</span>
          </Space>
        }
        open={!!hideModal}
        onOk={handleHide}
        onCancel={() => { setHideModal(null); setHideReason('') }}
        confirmLoading={hideQuestion.isPending}
        okText="Hide Question"
        okButtonProps={{ danger: true, disabled: !hideReason.trim() }}
        centered={isMobile}
      >
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          This will remove the question from the public view. The question will remain visible in this admin panel with a "Hidden" badge.
        </Paragraph>
        <Text strong>Reason for hiding *</Text>
        <Input.TextArea
          rows={3}
          value={hideReason}
          onChange={(e) => setHideReason(e.target.value)}
          placeholder="e.g. Contains personal phone number, Off-platform transaction attempt, Spam..."
          style={{ marginTop: 8 }}
          maxLength={500}
          showCount
        />
      </Modal>

      {/* Warn User Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>Warn User</span>
          </Space>
        }
        open={!!warnModal}
        onOk={handleWarn}
        onCancel={() => { setWarnModal(null); setWarnReason('') }}
        confirmLoading={flagUser.isPending}
        okText="Issue Warning"
        okButtonProps={{ style: { background: '#faad14', borderColor: '#faad14' }, disabled: !warnReason.trim() }}
        centered={isMobile}
      >
        {warnModal && (
          <>
            <Paragraph type="secondary" style={{ marginBottom: 8 }}>
              This creates a <Tag color="orange">qa_violation</Tag> risk flag on the user's account.
            </Paragraph>
            <Card size="small" style={{ marginBottom: 12, background: '#fafafa', borderRadius: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Offending message:</Text>
              <br />
              <Text italic>"{warnModal.question}"</Text>
            </Card>
            <Text strong>Warning reason *</Text>
            <Input.TextArea
              rows={3}
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="Describe the violation clearly for audit trail..."
              style={{ marginTop: 8 }}
              maxLength={500}
              showCount
            />
          </>
        )}
      </Modal>
    </div>
  )
}

// ── Individual Question Thread ────────────────────────────────────────

interface QuestionThreadProps {
  question: AdminItemQuestionDto
  isMobile: boolean
  onHide: () => void
  onShow: () => void
  onWarn: () => void
  isShowLoading: boolean
}

function QuestionThread({ question, isMobile, onHide, onShow, onWarn, isShowLoading }: QuestionThreadProps) {
  const isHidden = !question.isPublic

  return (
    <Card
      size="small"
      style={{
        borderRadius: 10,
        opacity: isHidden ? 0.7 : 1,
        background: isHidden ? '#fff2f0' : undefined,
        borderColor: isHidden ? '#ffccc7' : undefined,
      }}
    >
      {/* Question */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar
          size={32}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <Link to={`/admin/users/${question.askerId}`}>
              <Text strong style={{ fontSize: 13 }}>
                {question.askerDisplayName || question.askerId.substring(0, 8) + '...'}
              </Text>
            </Link>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined /> {formatDateTime(question.createdAt)}
            </Text>
            {isHidden && (
              <Tooltip title={`Hidden by admin: ${question.hiddenReason || 'No reason provided'}`}>
                <Tag color="red" icon={<EyeInvisibleOutlined />}>HIDDEN</Tag>
              </Tooltip>
            )}
            {question.answer && (
              <Tag color="green" icon={<CheckCircleOutlined />}>Answered</Tag>
            )}
          </div>

          <Paragraph
            style={{
              margin: 0,
              textDecoration: isHidden ? 'line-through' : undefined,
              color: isHidden ? '#999' : undefined,
            }}
          >
            {question.question}
          </Paragraph>

          {/* Hidden info banner */}
          {isHidden && question.hiddenAt && (
            <div style={{
              marginTop: 8,
              padding: '6px 10px',
              background: '#fff1f0',
              borderRadius: 6,
              border: '1px solid #ffa39e',
              fontSize: 12,
            }}>
              <EyeInvisibleOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hidden {formatDateTime(question.hiddenAt)}
                {question.hiddenReason && <> — Reason: <Text strong style={{ fontSize: 12 }}>{question.hiddenReason}</Text></>}
              </Text>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 4, flexShrink: 0 }}>
          {isHidden ? (
            <Popconfirm
              title="Restore this question?"
              description="This will make the question visible to the public again."
              onConfirm={onShow}
              okText="Restore"
            >
              <Tooltip title="Restore (show to public)">
                <Button
                  size="small"
                  type="default"
                  icon={<EyeOutlined />}
                  loading={isShowLoading}
                  style={{ color: '#52c41a', borderColor: '#b7eb8f' }}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Hide from public">
              <Button
                size="small"
                type="default"
                danger
                icon={<EyeInvisibleOutlined />}
                onClick={onHide}
              />
            </Tooltip>
          )}
          <Tooltip title="Warn user">
            <Button
              size="small"
              type="default"
              icon={<WarningOutlined />}
              onClick={onWarn}
              style={{ color: '#faad14', borderColor: '#ffe58f' }}
            />
          </Tooltip>
        </div>
      </div>

      {/* Answer (if exists) */}
      {question.answer && (
        <div style={{
          marginTop: 12,
          marginLeft: 44,
          padding: '10px 14px',
          background: '#f6ffed',
          borderRadius: 8,
          border: '1px solid #b7eb8f',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Badge status="success" />
            <Text strong style={{ fontSize: 13, color: '#389e0d' }}>
              {question.answererDisplayName || 'Seller'}
            </Text>
            {question.answeredAt && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {formatDateTime(question.answeredAt)}
              </Text>
            )}
          </div>
          <Paragraph style={{ margin: 0, color: '#262626' }}>
            {question.answer}
          </Paragraph>
        </div>
      )}
    </Card>
  )
}
