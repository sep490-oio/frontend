/**
 * ConfirmEmailPage — handles the email confirmation link.
 *
 * The backend sends an email with a link like:
 *   https://[our-domain]/confirm-email?userId=...&token=...
 *
 * This page reads those params from the URL, calls POST /api/auth/confirm-email,
 * and shows success or failure feedback to the user.
 */
import { useEffect, useState } from 'react';
import { Card, Typography, Button, Spin, Result } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { confirmEmail } from '@/services/authService';

const { Title, Text } = Typography;

type Status = 'loading' | 'success' | 'error';

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  useEffect(() => {
    // If either param is missing, fail immediately — the link is malformed
    if (!userId || !token) {
      setStatus('error');
      return;
    }

    confirmEmail(userId, token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [userId, token]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
        <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Result
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title={<Title level={4}>{t('auth.confirmEmailTitle')}</Title>}
            subTitle={<Text>{t('auth.confirmEmailSuccess')}</Text>}
            extra={
              <Button type="primary" block>
                <Link to="/login">{t('auth.loginButton')}</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
      <Card style={{ width: '100%', maxWidth: 420, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Result
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title={<Title level={4}>{t('auth.confirmEmailTitle')}</Title>}
          subTitle={<Text>{t('auth.confirmEmailFailed')}</Text>}
          extra={
            <Button block>
              <Link to="/register">{t('auth.registerButton')}</Link>
            </Button>
          }
        />
      </Card>
    </div>
  );
}
