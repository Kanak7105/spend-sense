import Link from "next/link";

import { AuthCard } from "@/frontend/components/layout/auth-shell";
import { authLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { LoginForm } from "@/frontend/features/auth/components/login-form";

const LoginPage: PageWithLayout = () => (
  <AuthCard
    title="Welcome back"
    description="Sign in to continue tracking your spending"
    footer={
      <>
        New to SpendSense?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </>
    }
  >
    <PageTitle title="Sign in" />
    <LoginForm />
  </AuthCard>
);

LoginPage.getLayout = authLayout;
export default LoginPage;
