// Client-side wrappers for the auth API routes.
import { apiRequest } from "@/frontend/lib/api-client";

import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "@/shared/schemas/auth";

export const signIn = (input: SignInInput) => apiRequest("POST", "/api/auth/sign-in", input);

export const signUp = (input: SignUpInput) =>
  apiRequest<{ needsConfirmation: boolean }>("POST", "/api/auth/sign-up", input);

export const requestPasswordReset = (input: ForgotPasswordInput) =>
  apiRequest("POST", "/api/auth/forgot-password", input);

export const updatePassword = (input: ResetPasswordInput) =>
  apiRequest("POST", "/api/auth/reset-password", input);

export const signOut = () => apiRequest("POST", "/api/auth/sign-out");
