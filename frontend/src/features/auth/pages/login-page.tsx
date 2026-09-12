import { useMutation } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LoadingState } from "@/shared/components/request-state";
import { sessionStorage } from "@/shared/api/session-storage";
import { LoginArtwork } from "../components/login-artwork";
import { LoginBrand } from "../components/login-brand";
import { LoginFooter } from "../components/login-footer";
import { SessionErrorPanel } from "../components/session-error-panel";
import { SignInForm } from "../components/sign-in-form";
import { authApi } from "../api/auth.api";
import { useSession } from "../hooks/use-session";

export default function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from: unknown = (location.state as { from?: unknown } | null)?.from;
  const destination =
    typeof from === "string" &&
    (from === "/admin" || from.startsWith("/admin/"))
      ? from
      : "/admin";
  const signIn = useMutation({
    mutationFn: authApi.signIn,
    onSuccess: ({ accessToken }) => {
      sessionStorage.setToken(accessToken);
      navigate(destination, { replace: true });
    },
  });
  if (session.hasToken && session.isPending)
    return <LoadingState label="Checking your session..." />;
  if (session.hasToken && session.isSuccess)
    return <Navigate to={destination} replace />;
  if (session.hasToken && session.isError)
    return (
      <SessionErrorPanel
        error={session.error}
        retry={() => void session.refetch()}
      />
    );

  return (
    <main className="flex min-h-svh flex-col bg-background">
      <LoginBrand />
      <div className="mx-auto grid w-[min(920px,88%)] flex-1 items-center gap-[90px] py-[30px] md:grid-cols-2 max-sm:w-[min(380px,88%)] max-sm:grid-cols-1">
        <LoginArtwork />
        <SignInForm
          error={signIn.error}
          isError={signIn.isError}
          isPending={signIn.isPending}
          signIn={signIn.mutate}
        />
      </div>
      <LoginFooter />
    </main>
  );
}
