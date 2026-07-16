"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirect: false, // We'll handle redirection on the client if it fails, or it throws if success? Wait, Auth.js v5 throws on success if redirect is true.
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email atau password salah." }
        default:
          return { error: "Terjadi kesalahan pada sistem." }
      }
    }
    throw error
  }
}
