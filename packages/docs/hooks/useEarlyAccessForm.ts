'use client'

import { useActionState } from 'react'

export type FormState = {
  succeeded: boolean
  errors: { name?: string; email?: string }
}

const submitAction = async (prevState: FormState, formData: FormData): Promise<FormState> => {
  const name = formData.get('name')?.toString().trim() || ''
  const email = formData.get('email')?.toString().trim() || ''

  const errors: { name?: string; email?: string } = {}
  if (!name) errors.name = 'Name is required'
  if (!email) errors.email = 'Email is required'

  if (Object.keys(errors).length) {
    return { succeeded: false, errors }
  }

  try {
    const res = await fetch('/campaign/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    })

    if (!res.ok) {
      return { succeeded: false, errors: { email: 'Submission failed' } }
    }

    return { succeeded: true, errors: {} }
  } catch {
    return { succeeded: false, errors: { email: 'Submission failed' } }
  }
}

const useEarlyAccessForm = () =>
  useActionState<FormState, FormData>(submitAction, {
    succeeded: false,
    errors: {},
  })

export default useEarlyAccessForm 