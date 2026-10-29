import { AuthCard } from "@/frontend/components/layout/auth-shell";
import { authLayout, type PageWithLayout } from "@/frontend/components/layout/page-layout";
import { PageTitle } from "@/frontend/components/shared/page-title";
import { ResetPasswordForm } from "@/frontend/features/auth/components/reset-password-form";
import { withUser } from "@/backend/lib/auth";

// Reached from the email link via /api/auth/callback, which signs the user in first.
export const getServerSideProps = withUser();

const ResetPasswordPage: PageWithLayout = () => (
  <AuthCard title="Set a new password" description="Choose something you haven't used before">
    <PageTitle title="Set new password" />
    <ResetPasswordForm />
  </AuthCard>
);

ResetPasswordPage.getLayout = authLayout;
export default ResetPasswordPage;
