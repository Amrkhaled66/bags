import { request } from "@/shared/api/client";
import type { SignInValues } from "../schemas/sign-in";
import type { Admin, SignInResponse } from "../types/auth";

export const authApi = {
  signIn: (values: SignInValues) =>
    request<SignInResponse>("/auth/admin/signin", {
      method: "POST",
      body: values,
      authenticated: false,
    }),
  me: (signal?: AbortSignal) => request<Admin>("/auth/admin/me", { signal }),
};
