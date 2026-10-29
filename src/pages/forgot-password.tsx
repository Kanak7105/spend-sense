import Link from "next/link";

import { AuthCard } from "@/frontend/components/layout/auth-shell";
import { authLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { ForgotPasswordForm } from "@/frontend/features/auth/components/forgot-password-form";

const ForgotPasswordPage: PageWithLayout = () => (
  <AuthCard
    title="Reset your password"
    description="We'll email you a link to set a new one"
    footer={
      <Link
        href="/login"
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    }
  >
    <PageTitle title="Reset password" />
    <ForgotPasswordForm />
  </AuthCard>
);

ForgotPasswordPage.getLayout = authLayout;
export default ForgotPasswordPage;
