import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Home, Loader2, Shield, Users, Mail, Phone, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { ConfirmationResult } from 'firebase/auth'

const emailLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const phoneLoginSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number (e.g., +919876543210)'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

type EmailLoginForm = z.infer<typeof emailLoginSchema>
type PhoneLoginForm = z.infer<typeof phoneLoginSchema>
type OtpForm = z.infer<typeof otpSchema>

export default function LoginPage() {
  const { signIn, signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, setupRecaptcha, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'admin' | 'tenant'>('tenant')
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [otpSent, setOtpSent] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  const returnUrl = searchParams.get('returnUrl') || (mode === 'admin' ? '/admin' : '/portal')

  useEffect(() => {
    // Redirect if already logged in and profile loaded
    if (profile) {
      if (['super_admin', 'admin', 'manager', 'staff'].includes(profile.role)) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/portal', { replace: true })
      }
    }
  }, [profile, navigate])

  useEffect(() => {
    if (loginMethod === 'phone') {
      setupRecaptcha('recaptcha-container')
    }
  }, [loginMethod, setupRecaptcha])

  const emailForm = useForm<EmailLoginForm>({ resolver: zodResolver(emailLoginSchema) })
  const phoneForm = useForm<PhoneLoginForm>({ resolver: zodResolver(phoneLoginSchema) })
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) })

  const onEmailSubmit = async (data: EmailLoginForm) => {
    const { error, profile: loggedInProfile } = await signIn(data.email, data.password)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Welcome back!')
    
    if (loggedInProfile) {
      if (['super_admin', 'admin', 'manager', 'staff'].includes(loggedInProfile.role)) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/portal', { replace: true })
      }
    }
  }

  const onPhoneSubmit = async (data: PhoneLoginForm) => {
    // Format phone number to E.164 if not already (assuming India +91 if missing)
    let phoneNumber = data.phone
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+91${phoneNumber}`
    }
    
    const { confirmationResult: result, error } = await sendPhoneOtp(phoneNumber)
    if (error) {
      toast.error(error)
      return
    }
    setConfirmationResult(result || null)
    setOtpSent(true)
    toast.success('OTP sent successfully!')
  }

  const onOtpSubmit = async (data: OtpForm) => {
    if (!confirmationResult) return
    const { error } = await verifyPhoneOtp(confirmationResult, data.otp)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Logged in successfully!')
  }

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Google sign in successful!')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left – decorative */}
      <div className="hidden lg:flex flex-col flex-1 bg-hero-gradient relative overflow-hidden p-12">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${60 + Math.random() * 120}px`,
                height: `${60 + Math.random() * 120}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.05 + Math.random() * 0.1,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl font-display">Bangalore Premium PG</h1>
              <p className="text-white/60 text-sm">Management Platform</p>
            </div>
          </div>

          <div className="mt-auto pt-20">
            <h2 className="text-4xl font-bold text-white font-display leading-tight mb-4">
              Your Complete<br />PG Management<br />Solution
            </h2>
            <p className="text-white/70 text-lg max-w-sm">
              Manage properties, tenants, payments, and complaints — all from one platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right – login form */}
      <div className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-saffron flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold font-display">Bangalore PG</h1>
          </div>

          <h2 className="text-2xl font-bold font-display text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your account to continue</p>

          {/* Mode selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6">
            <button
              onClick={() => setMode('tenant')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'tenant'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" /> Tenant
            </button>
            <button
              onClick={() => setMode('admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'admin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          {/* Method selector */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button
              onClick={() => { setLoginMethod('email'); setOtpSent(false); }}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                loginMethod === 'email' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setOtpSent(false); }}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                loginMethod === 'phone' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Phone (OTP)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loginMethod === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4"
              >
                <div>
                  <label className="form-label block mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder={mode === 'admin' ? 'admin@bangalorepg.com' : 'your@email.com'}
                      className="form-input !pl-10"
                      {...emailForm.register('email')}
                    />
                  </div>
                  {emailForm.formState.errors.email && <p className="form-error">{emailForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label">Password</label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="form-input !pr-10"
                      {...emailForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {emailForm.formState.errors.password && <p className="form-error">{emailForm.formState.errors.password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={emailForm.formState.isSubmitting}
                  className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  {emailForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {!otpSent ? (
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label block mb-1.5">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          className="form-input !pl-10"
                          {...phoneForm.register('phone')}
                        />
                      </div>
                      {phoneForm.formState.errors.phone && <p className="form-error">{phoneForm.formState.errors.phone.message}</p>}
                    </div>

                    <div id="recaptcha-container" className="mb-4"></div>

                    <button
                      type="submit"
                      disabled={phoneForm.formState.isSubmitting}
                      className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      {phoneForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label block mb-1.5">Enter 6-digit OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        className="form-input text-center text-lg tracking-[0.5em] font-mono"
                        {...otpForm.register('otp')}
                      />
                      {otpForm.formState.errors.otp && <p className="form-error text-center">{otpForm.formState.errors.otp.message}</p>}
                    </div>
                    <button
                      type="submit"
                      disabled={otpForm.formState.isSubmitting}
                      className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      {otpForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Login'}
                    </button>
                    <div className="text-center mt-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="w-full h-px bg-border flex-1"></div>
            <span className="px-3">or continue with</span>
            <div className="w-full h-px bg-border flex-1"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register here
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-3">
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Back to Website
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
