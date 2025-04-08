import { useEffect, useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react'
import { api } from '../lib/client'

interface LoginPageProps {
  onAuthenticated: (token: string) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [captchaID, setCaptchaID] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refreshCaptcha = async () => {
    try {
      setCaptchaID(await api.captcha())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '验证码加载失败')
    }
  }

  useEffect(() => {
    void refreshCaptcha()
  }, [])

  const submit = async (values: { username: string; password: string; captcha: string }) => {
    setLoading(true)
    setError('')
    try {
      const token = await api.login(values.username, values.password, captchaID, values.captcha)
      onAuthenticated(token.access_token)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录失败')
      await refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-story" aria-label="产品介绍">
        <div className="brand-lockup light">
          <span className="brand-mark">AP</span>
          <span>AavePulse</span>
        </div>
        <div className="story-index">READ-ONLY / ETHEREUM / V3</div>
        <h1>看清 Aave<br />资金脉搏。</h1>
        <p>把 The Graph 的链上索引，变成可追踪、可审计、可复现的 DeFi 数据后台。</p>
        <div className="story-stats">
          <span><strong>90D</strong>历史快照</span>
          <span><strong>0</strong>链上写操作</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="eyebrow"><ShieldCheck size={16} /> RBAC ACCESS</div>
          <h2>进入监控台</h2>
          <p className="muted">本地演示账户：<code>admin / abc-123</code></p>
          {error ? <Alert type="error" message={error} showIcon /> : null}
          <Form layout="vertical" onFinish={submit} initialValues={{ username: 'admin', password: 'abc-123' }}>
            <Form.Item name="username" label="账户" rules={[{ required: true, message: '请输入账户' }]}>
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item label="验证码" required>
              <div className="captcha-row">
                <Form.Item name="captcha" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                  <Input maxLength={8} />
                </Form.Item>
                <button type="button" className="captcha-image" onClick={() => void refreshCaptcha()} aria-label="刷新验证码">
                  {captchaID ? <img src={api.captchaImage(captchaID)} alt="验证码" /> : <RefreshCw size={20} />}
                </button>
              </div>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="login-submit">
              验证并进入 <ArrowRight size={17} />
            </Button>
          </Form>
        </div>
      </section>
    </main>
  )
}
