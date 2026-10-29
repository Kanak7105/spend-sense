import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/frontend/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { handleActionError } from "@/frontend/lib/form";
import { safeNextPath } from "@/shared/lib/routes";

import { signIn } from "@/frontend/features/auth/api";
import { signInSchema, type SignInInput } from "@/shared/schemas/auth";
import { GoogleButton } from "./google-button";

export function LoginForm() {
  const router = useRouter();
  const nextParam = router.query.next;
  const next = safeNextPath(typeof nextParam === "string" ? nextParam : null);
  const authError = router.query.error;

  useEffect(() => {
    if (authError) toast.error("That sign-in link is invalid or has expired. Please try again.");
  }, [authError]);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: SignInInput) {
    const result = await signIn(values);
    if (!result.ok) return handleActionError(result, form.setError);
    // The session cookie arrived with the API response, so getServerSideProps sees it.
    await router.replace(next);
  }

  return (
    <FieldGroup>
      <GoogleButton next={next} />
      <FieldSeparator>or with email</FieldSeparator>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
    </FieldGroup>
  );
}
