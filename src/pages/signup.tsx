import Link from "next/link";

import { AuthCard } from "@/frontend/components/layout/auth-shell";
import { authLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { SignupForm } from "@/frontend/features/auth/components/signup-form";

const SignupPage: PageWithLayout = () => (
  <AuthCard
    title="Create your account"
    description="Start tracking in under a minute"
    footer={
      <>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </>
    }
  >
    <PageTitle title="Create account" />
    <SignupForm />
  </AuthCard>
);

SignupPage.getLayout = authLayout;
export default SignupPage;
