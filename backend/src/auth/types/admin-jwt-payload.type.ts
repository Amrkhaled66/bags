export type AdminJwtPayload = {
  sub: string;
  email: string;
  role: string | null;
  type: 'admin';
};
