import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseMutateFunction } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { ErrorState } from "@/shared/components/request-state";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { signInSchema, type SignInValues } from "../schemas/sign-in";

interface SignInFormProps {
  error: unknown;
  isError: boolean;
  isPending: boolean;
  signIn: UseMutateFunction<unknown, Error, SignInValues>;
}

export function SignInForm({
  error,
  isError,
  isPending,
  signIn,
}: SignInFormProps) {
  const [visible, setVisible] = useState(false);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <section className="min-w-0" aria-labelledby="login-title">
      <p className="text-xs font-medium text-primary mb-4">STORE MANAGEMENT</p>
      <h1 id="login-title" className="text-3xl font-semibold mb-2">
        Welcome back.
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Sign in to your store account.
      </p>
      <form
        onSubmit={form.handleSubmit((values) => signIn(values))}
        className="space-y-5"
        noValidate
      >
        {isError && <ErrorState error={error} />}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@store.com"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={
              form.formState.errors.email ? "email-error" : undefined
            }
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p
              id="email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              className="pe-12"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={
                form.formState.errors.password ? "password-error" : undefined
              }
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-0 top-0"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {form.formState.errors.password ? (
            <p
              id="password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="ms-auto" />
            </>
          )}
        </Button>
      </form>
      <p className="mt-6 text-xs text-muted-foreground">
        Access is restricted to store administrators.
      </p>
    </section>
  );
}
