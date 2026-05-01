import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const signupGenderEnum = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say',
])

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, hyphens, and underscores',
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    date_of_birth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((val) => {
        const d = new Date(val.includes('T') ? val : `${val}T00:00:00`)
        return !Number.isNaN(d.getTime())
      }, 'Enter a valid date')
      .refine((val) => {
        const d = new Date(val.includes('T') ? val : `${val}T00:00:00`)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return d <= today
      }, 'Date of birth cannot be in the future'),
    gender: z.union([signupGenderEnum, z.literal('')]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

export const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
})
