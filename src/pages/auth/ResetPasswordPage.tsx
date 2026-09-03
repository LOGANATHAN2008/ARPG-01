import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Home, Loader2, ShieldCheck } from 'lucide-react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import toast from 'react-hot-toast'

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null)
  const [email, setEmail] = useState<string>('')
  
  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    if (!oobCode) {
      toast.error('Invalid or missing reset code')
      navigate('/login')
      return
    }

    // Verify the code
    verifyPasswordResetCode(auth, oobCode)
      .then((emailRes) => {
        setIsValidCode(true)
        setEmail(emailRes)
      })
      .catch((error) => {
        console.error(error)
        setIsValidCode(false)
        toast.error('Invalid or expired password reset code')
      })
  }, [oobCode, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) })

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!oobCode) return
    
    try {
      await confirmPasswordReset(auth, oobCode, data.password)
      toast.success('Password reset successfully! You can now sign in.')
      navigate('/login')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to reset password')
    }
  }

  if (isValidCode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isValidCode === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
          <p className="text-muted-foreground mb-4">The password reset link is invalid or has expired.</p>
          <button onClick={() => navigate('/forgot-password')} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl">
            Request new link
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 pg-card"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-saffron flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-display text-foreground text-center">Set New Password</h2>
          <p className="text-muted-foreground text-sm text-center mt-2">
            Create a new password for {email}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label block mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="form-input pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div>
            <label className="form-label block mb-1.5">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="form-input"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
