export interface Admin {
  id: string;
  email: string;
  role: string | null;
}
export interface SignInResponse {
  accessToken: string;
  admin: Admin;
}
