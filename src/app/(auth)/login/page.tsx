"use client"

import { useActionState } from "react"
import { loginAction } from "@/actions/auth"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const router = useRouter()

  if (state?.success) {
    router.push("/")
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>SIRAYA</h1>
          <p>Yayasan Al Basyariah</p>
        </div>

        <form action={formAction}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="admin@albasyariah.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="alert-error">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
          >
            {isPending ? "Sedang masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  )
}
