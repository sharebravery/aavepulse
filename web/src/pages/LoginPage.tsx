import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Database, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '../lib/client'
import { copy, errorMessage } from '../lib/copy'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { StatusPill } from '../components/StatusPill'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'

interface LoginPageProps {
  onAuthenticated: (token: string) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [captchaID, setCaptchaID] = useState('')
  const [captchaEnabled, setCaptchaEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [values, setValues] = useState({ username: 'admin', password: 'abc-123', captcha: '' })

  const refreshCaptcha = async () => {
    try {
      const challenge = await api.captcha()
      setCaptchaID(challenge.captchaID)
      setCaptchaEnabled(challenge.enabled)
      setValues((current) => ({ ...current, captcha: '' }))
    } catch (cause) {
      setError(errorMessage(cause, copy.auth.captchaLoadError))
    }
  }

  useEffect(() => { void refreshCaptcha() }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values.username || !values.password || (captchaEnabled && !values.captcha)) {
      setError(copy.auth.completeFields)
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = await api.login(values.username, values.password, captchaID, values.captcha)
      onAuthenticated(token.access_token)
    } catch (cause) {
      setError(errorMessage(cause, copy.auth.invalidCredentials))
      await refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-void text-ink">
      <div className="terminal-grid absolute inset-0 opacity-60" />
      <div className="absolute -left-24 top-20 h-96 w-96 rounded-full bg-blue/15 blur-3xl" />
      <div className="animate-drift absolute right-[12%] top-[12%] h-72 w-72 rounded-full border border-cyan/15 bg-cyan/[0.04] blur-[1px]" />
      <div className="animate-drift absolute bottom-[-8rem] right-[28%] h-96 w-96 rounded-full border border-blue/10 bg-blue/[0.05] blur-3xl [animation-delay:-6s]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1480px] items-center gap-10 px-5 py-8 lg:grid-cols-[1fr_440px] lg:px-12">
        <section className="hidden max-w-2xl lg:block">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan/30 bg-gradient-to-br from-blue to-cyan font-mono text-xs font-semibold text-void">AP</span><span className="font-mono text-base font-semibold tracking-[-0.04em]">AavePulse</span><StatusPill status="neutral" label={copy.auth.readOnly} /></div>
          <p className="mt-20 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan">{copy.auth.eyebrow}</p>
          <h1 className="mt-5 max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.07em] text-ink xl:text-7xl">Follow the<br /><span className="bg-gradient-to-r from-ink via-cyan to-blue bg-clip-text text-transparent">liquidity pulse.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-muted">{copy.auth.description}</p>
          <div className="mt-12 grid max-w-xl grid-cols-3 gap-3">
            <Feature icon={<Database />} value="90D" label={copy.auth.snapshotHistory} />
            <Feature icon={<Sparkles />} value="6" label={copy.auth.reserveMarkets} />
            <Feature icon={<ShieldCheck />} value="0" label={copy.auth.chainWrites} />
          </div>
        </section>

        <section className="w-full">
          <div className="mb-6 flex items-center justify-between lg:hidden"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/30 bg-gradient-to-br from-blue to-cyan font-mono text-xs font-semibold text-void">AP</span><span className="font-mono text-sm font-semibold">AavePulse</span></div><StatusPill status="neutral" label={copy.auth.readOnly} /></div>
          <div className="panel-sheen rounded-[1.5rem] border border-line bg-surface/85 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">{copy.auth.secureWorkspace}</p><h2 className="mt-3 text-2xl font-medium tracking-[-0.05em]">{copy.auth.signInTitle}</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-mint/10 text-mint"><ShieldCheck className="h-5 w-5" /></span></div>
            <p className="mt-3 text-sm text-muted">{copy.auth.signInDescription}</p>
            {error ? <div role="alert" className="mt-5 rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">{error}</div> : null}
            <form className="mt-7 space-y-4" onSubmit={(event) => void submit(event)}>
              <Field label={copy.auth.username}><Input autoComplete="username" value={values.username} onChange={(event) => setValues((current) => ({ ...current, username: event.target.value }))} /></Field>
              <Field label={copy.auth.password}><Input type="password" autoComplete="current-password" value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} /></Field>
              {captchaEnabled ? <Field label={copy.auth.captcha}><div className="flex items-center gap-2"><Input maxLength={8} value={values.captcha} onChange={(event) => setValues((current) => ({ ...current, captcha: event.target.value }))} /><TooltipProvider><Tooltip><TooltipTrigger asChild><button type="button" aria-label={copy.auth.refreshCaptcha} onClick={() => void refreshCaptcha()} className="aspect-[5/2] w-32 shrink-0 overflow-hidden rounded-control border border-line bg-white/[0.04] transition-colors hover:border-cyan/50">{captchaID ? <img className="h-full w-full object-contain" src={api.captchaImage(captchaID)} alt={copy.auth.captcha} /> : <RefreshCw className="mx-auto h-4 w-4 text-muted" />}</button></TooltipTrigger><TooltipContent>{copy.auth.refreshCaptcha}</TooltipContent></Tooltip></TooltipProvider></div></Field> : <div className="rounded-control border border-mint/20 bg-mint/5 px-3 py-2.5 text-xs text-mint">{copy.auth.demoCaptchaDisabled}</div>}
              <Button type="submit" size="lg" className="mt-3 w-full" disabled={loading}>{loading ? copy.auth.signingIn : copy.auth.signIn}<ArrowRight className="h-4 w-4" /></Button>
            </form>
            <p className="mt-6 border-t border-line pt-5 text-xs text-muted">{copy.auth.demoAccount} <code className="text-cyan">admin / abc-123</code></p>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</span>{children}</label>
}

function Feature({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="rounded-card border border-line bg-surface/60 p-4"><span className="text-cyan">{icon}</span><strong className="mt-4 block font-mono text-xl font-medium">{value}</strong><span className="mt-1 block text-xs text-muted">{label}</span></div>
}
