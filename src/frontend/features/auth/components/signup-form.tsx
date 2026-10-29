import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/frontend/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { handleActionError } from "@/frontend/lib/form";

import { signUp } from "@/frontend/features/auth/api";
import { signUpSchema, type SignUpInput } from "@/shared/schemas/auth";
import { GoogleButton } from "./google-button";

export function SignupForm() {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: SignUpInput) {
    const result = await signUp(values);
    if (!result.ok) return handleActionError(result, form.setError);
    if (result.data.needsConfirmation) setSentTo(values.email);
    else await router.replace("/dashboard");
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <MailCheck className="size-10 text-primary" />
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium">{sentTo}</span>.
        </p>
      </div>
    );
  }

  return (
    <FieldGroup>
      <GoogleButton next="/dashboard" />
      <FieldSeparator>or with email</FieldSeparator>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.fullName}>
            <FieldLabel htmlFor="fullName">Name</FieldLabel>
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              {...form.register("fullName")}
            />
            <FieldError errors={[errors.fullName]} />
          </Field>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
            <FieldError errors={[errors.password]} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </FieldGroup>
      </form>
    </FieldGroup>
  );
}
