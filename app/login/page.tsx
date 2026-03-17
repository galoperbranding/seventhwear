'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type Step = 'email' | 'login' | 'register' | 'verify';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Bot protection
  const formLoadedAt = useRef(Date.now());

  const { login, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle Google error params
  useEffect(() => {
    const err = searchParams.get('error');
    if (err?.startsWith('google_')) {
      const messages: Record<string, string> = {
        google_denied: 'Inicio con Google cancelado',
        google_unverified: 'Tu email de Google no está verificado',
        google_error: 'Error al conectar con Google. Inténtalo de nuevo.',
      };
      setError(messages[err] || 'Error al iniciar con Google');
    }
    // If coming from /registro, start in register mode
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setStep('email');
    }
  }, [searchParams]);

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ─── Step 1: Check email ───
  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al verificar email');

      if (data.exists) {
        setStep('login');
      } else {
        setStep('register');
        formLoadedAt.current = Date.now();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al verificar email');
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2a: Login ───
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/cuenta');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      // If unverified, switch to verify step
      if (msg.includes('verificar')) {
        setStep('verify');
        setCountdown(60);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2b: Register ───
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, email, password,
          birthDate: birthDate || undefined,
          _t: formLoadedAt.current,
          _hp: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');

      if (data.requiresVerification) {
        setStep('verify');
        setCountdown(60);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 3: Verify code ───
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al verificar');

      await refreshUser();
      showToast('¡Cuenta verificada! Bienvenido a SEVENTHWEAR');
      router.push('/cuenta?welcome=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al verificar');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'resend' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Código reenviado a tu email');
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reenviar');
    } finally {
      setResending(false);
    }
  }

  function goBack() {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setBirthDate('');
    setVerifyCode('');
    setStep('email');
  }

  // Google SVG shared
  const googleSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  // ═══════════════════════════════════════════
  // VERIFY STEP
  // ═══════════════════════════════════════════
  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Verifica tu email</h1>
            <p>Enviamos un código de 6 dígitos a <strong>{email}</strong></p>
          </div>

          <form onSubmit={handleVerify} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label>Código de verificación</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="000000"
                autoFocus
                className="verify-code-input"
              />
            </div>

            <button type="submit" disabled={loading || verifyCode.length !== 6} className="btn btn-primary auth-submit">
              {loading ? 'Verificando...' : 'Verificar cuenta'}
            </button>

            <p className="auth-alt">
              ¿No recibiste el código?{' '}
              <button type="button" onClick={handleResend} disabled={countdown > 0 || resending} className="auth-link-btn">
                {resending ? 'Reenviando...' : countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
              </button>
            </p>

            <p className="auth-alt">
              <button type="button" onClick={goBack} className="auth-link-btn">
                ← Usar otro email
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LOGIN STEP
  // ═══════════════════════════════════════════
  if (step === 'login') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Bienvenido de vuelta</h1>
            <div className="auth-email-badge">
              <span>{email}</span>
              <button type="button" onClick={goBack} className="auth-email-edit" title="Cambiar email">✕</button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Tu contraseña"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // REGISTER STEP
  // ═══════════════════════════════════════════
  if (step === 'register') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Crear cuenta</h1>
            <div className="auth-email-badge">
              <span>{email}</span>
              <button type="button" onClick={goBack} className="auth-email-edit" title="Cambiar email">✕</button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {/* Honeypot */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true" tabIndex={-1}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Nombre</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Nombre" autoFocus />
              </div>
              <div className="auth-field">
                <label>Apellido</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Apellido" />
              </div>
            </div>

            <div className="auth-field">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" />
            </div>

            <div className="auth-field">
              <label>Confirmar contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repite tu contraseña" />
            </div>

            <div className="auth-field">
              <label>Fecha de nacimiento <span className="auth-optional">(opcional)</span></label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              <span className="auth-field-hint">🎂 Te enviaremos un saludo y descuento por tu cumpleaños</span>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // EMAIL STEP (initial — like Claude)
  // ═══════════════════════════════════════════
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Accede a SEVENTHWEAR</h1>
          <p>Inicia sesión o crea tu cuenta</p>
        </div>

        <div className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <a href="/api/auth/google" className="btn-google">
            {googleSvg}
            Continuar con Google
          </a>

          <div className="auth-divider"><span>o</span></div>

          <form onSubmit={handleEmailSubmit}>
            <div className="auth-field">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Ingresa tu correo electrónico"
                autoFocus
              />
            </div>

            <button type="submit" disabled={loading || !email} className="btn btn-primary auth-submit" style={{ marginTop: '1rem' }}>
              {loading ? 'Verificando...' : 'Continuar con correo electrónico'}
            </button>
          </form>

          <p className="auth-legal">
            Al continuar, aceptas nuestra{' '}
            <a href="/privacidad">Política de Privacidad</a>{' '}
            y{' '}
            <a href="/terminos">Términos y Condiciones</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
