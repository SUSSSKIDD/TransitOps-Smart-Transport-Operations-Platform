import { z } from 'zod'
import { normalizedEmail, trimmedString } from '../../utils/sanitize'

export const LoginSchema = {
  body: z.object({
    email: normalizedEmail(),
    password: trimmedString(),
  }),
}

export type LoginInput = z.infer<typeof LoginSchema.body>
