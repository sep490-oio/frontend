import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button } from 'antd'
import {
  SearchOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function AboutPage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const isVi = i18n.language === 'vi'

  // Vietnamese doesn't render well in DM Serif Display — use Inter bold instead
  const headingFont = isVi ? SANS_FONT : SERIF_FONT
  const headingWeight = isVi ? 600 : 400

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
      {/* ─── Hero Section ─── */}
      <section
        className="oio-fade-in"
        style={{ textAlign: 'center', padding: isMobile ? '60px 0 48px' : '120px 0 100px' }}
      >
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: 24,
          }}
        >
          {t('about.heroLabel', 'OIO Auction House')}
        </p>
        <h1
          style={{
            fontFamily: headingFont,
            fontSize: isMobile ? (isVi ? 28 : 32) : (isVi ? 44 : 56),
            fontWeight: headingWeight,
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
            maxWidth: 800,
            margin: '0 auto 24px',
            letterSpacing: isVi ? '-0.01em' : '-0.02em',
          }}
        >
          {t('about.heroTitle', isVi ? 'Nền Tảng Đấu Giá Trực Tuyến Cao Cấp' : 'The Quiet Authority of Exceptional Things')}
        </h1>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 18,
            lineHeight: 1.7,
            color: 'var(--color-text-secondary)',
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          {t(
            'about.heroDescription',
            'Nơi hội tụ những món đồ tinh tế, được tuyển chọn kỹ lưỡng cho những người sành sỏi.',
          )}
        </p>
      </section>

      {/* Divider */}
      <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: '0 auto', opacity: 0.4 }} />

      {/* ─── Our Story ─── */}
      <section
        className="oio-fade-in oio-fade-in-delay-1"
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 80, alignItems: 'center', padding: isMobile ? '48px 0' : '100px 0' }}
      >
        <div>
          <p style={{ fontFamily: SANS_FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 16 }}>
            {t('about.storyLabel', 'Câu chuyện của chúng tôi')}
          </p>
          <h2 style={{ fontFamily: headingFont, fontSize: isVi ? 30 : 36, fontWeight: headingWeight, lineHeight: 1.2, color: 'var(--color-text-primary)', marginBottom: 24 }}>
            {t('about.storyTitle', 'Kết nối người yêu thích với những món đồ phi thường')}
          </h2>
          <p style={{ fontFamily: SANS_FONT, fontSize: 15, lineHeight: 1.8, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            {t('about.storyParagraph1', 'OIO ra đời từ niềm tin rằng mỗi món đồ đều mang trong mình một câu chuyện. Chúng tôi tạo ra không gian nơi những người sưu tầm, những nhà đầu tư và những tâm hồn yêu cái đẹp có thể tìm thấy những tác phẩm xứng đáng.')}
          </p>
          <p style={{ fontFamily: SANS_FONT, fontSize: 15, lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
            {t('about.storyParagraph2', 'Với quy trình kiểm định nghiêm ngặt và nền tảng công nghệ tiên tiến, mỗi phiên đấu giá trên OIO đều đảm bảo tính minh bạch, công bằng và an toàn tuyệt đối.')}
          </p>
        </div>

        {/* Stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: isMobile ? '24px 20px' : '48px 40px', background: 'var(--color-bg-surface)', borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 24, right: 24, fontFamily: SERIF_FONT, fontSize: 72, color: 'var(--color-accent)', opacity: 0.08, lineHeight: 1 }}>
            OIO
          </div>
          {[
            { number: '2024', label: t('about.statFounded', 'Năm thành lập') },
            { number: '10,000+', label: t('about.statItems', 'Sản phẩm đã đấu giá') },
            { number: '99.8%', label: t('about.statSatisfaction', 'Khách hàng hài lòng') },
          ].map((stat) => (
            <div key={stat.label} style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {stat.number}
              </div>
              <div style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="oio-fade-in oio-fade-in-delay-2" style={{ padding: isMobile ? '48px 0' : '100px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: SANS_FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 16 }}>
          {t('about.howItWorksLabel', 'Cách thức hoạt động')}
        </p>
        <h2 style={{ fontFamily: headingFont, fontSize: isVi ? 30 : 36, fontWeight: headingWeight, color: 'var(--color-text-primary)', marginBottom: 64 }}>
          {t('about.howItWorksTitle', 'Ba bước đơn giản')}
        </h2>

        <div className="oio-stagger" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 24 : 48 }}>
          {[
            { icon: <SearchOutlined style={{ fontSize: 28, color: 'var(--color-accent)' }} />, title: t('about.step1Title', 'Khám phá'), desc: t('about.step1Desc', 'Duyệt qua bộ sưu tập đa dạng với hàng ngàn sản phẩm được kiểm định chất lượng.') },
            { icon: <ThunderboltOutlined style={{ fontSize: 28, color: 'var(--color-accent)' }} />, title: t('about.step2Title', 'Đấu giá'), desc: t('about.step2Desc', 'Đặt giá thầu theo thời gian thực. Hệ thống tự động đấu giá thông minh hỗ trợ bạn.') },
            { icon: <TrophyOutlined style={{ fontSize: 28, color: 'var(--color-accent)' }} />, title: t('about.step3Title', 'Chiến thắng'), desc: t('about.step3Desc', 'Thanh toán an toàn và nhận hàng tận nơi với dịch vụ vận chuyển đáng tin cậy.') },
          ].map((step) => (
            <div key={step.title} style={{ padding: isMobile ? '20px 16px' : '40px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                {step.icon}
              </div>
              <h3 style={{ fontFamily: headingFont, fontSize: isVi ? 20 : 22, fontWeight: headingWeight, color: 'var(--color-text-primary)', marginBottom: 12 }}>
                {step.title}
              </h3>
              <p style={{ fontFamily: SANS_FONT, fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Trust & Security ─── */}
      <section className="oio-fade-in oio-fade-in-delay-3" style={{ padding: isMobile ? '48px 0' : '100px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: SANS_FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 16 }}>
          {t('about.trustLabel', 'Uy tín & Bảo mật')}
        </p>
        <h2 style={{ fontFamily: headingFont, fontSize: isVi ? 30 : 36, fontWeight: headingWeight, color: 'var(--color-text-primary)', marginBottom: 64 }}>
          {t('about.trustTitle', 'Đấu giá với sự an tâm tuyệt đối')}
        </h2>

        <div className="oio-stagger" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 32 }}>
          {[
            { icon: <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />, title: t('about.trust1Title', 'Người bán xác minh'), desc: t('about.trust1Desc', 'Mọi người bán đều trải qua quy trình xác minh danh tính nghiêm ngặt.') },
            { icon: <LockOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />, title: t('about.trust2Title', 'Thanh toán an toàn'), desc: t('about.trust2Desc', 'Mã hóa SSL và hệ thống ví điện tử bảo mật tuyệt đối.') },
            { icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />, title: t('about.trust3Title', 'Kiểm định chất lượng'), desc: t('about.trust3Desc', 'Đội ngũ chuyên gia kiểm tra từng sản phẩm trước khi đấu giá.') },
            { icon: <StarOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />, title: t('about.trust4Title', 'Hỗ trợ 24/7'), desc: t('about.trust4Desc', 'Đội ngũ hỗ trợ khách hàng luôn sẵn sàng giải đáp mọi thắc mắc.') },
          ].map((item) => (
            <div key={item.title} style={{ padding: isMobile ? '16px 12px' : '32px 24px', background: 'var(--color-bg-card)', borderRadius: 2, border: '1px solid var(--color-border-light)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                {item.icon}
              </div>
              <h4 style={{ fontFamily: headingFont, fontSize: isVi ? 16 : 18, fontWeight: headingWeight, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                {item.title}
              </h4>
              <p style={{ fontFamily: SANS_FONT, fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="oio-fade-in" style={{ textAlign: 'center', padding: isMobile ? '40px 0 60px' : '80px 0 120px' }}>
        <div style={{ width: 48, height: 1, background: 'var(--color-accent)', margin: '0 auto 48px', opacity: 0.4 }} />
        <h2 style={{ fontFamily: headingFont, fontSize: isVi ? 30 : 36, fontWeight: headingWeight, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          {t('about.ctaTitle', 'Bắt đầu khám phá')}
        </h2>
        <p style={{ fontFamily: SANS_FONT, fontSize: 16, color: 'var(--color-text-secondary)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          {t('about.ctaDescription', 'Khám phá hàng ngàn sản phẩm độc đáo đang chờ đón bạn trên OIO.')}
        </p>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/auctions')}
          className="oio-press"
          style={{ height: 52, padding: '0 48px', borderRadius: 2, fontWeight: 500, fontSize: 15, fontFamily: SANS_FONT, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('about.ctaButton', 'Khám phá ngay')}
        </Button>
      </section>
    </div>
  )
}
