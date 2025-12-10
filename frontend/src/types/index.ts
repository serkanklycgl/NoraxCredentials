export type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export type Credential = {
  id: string;
  categoryId: string;
  name: string;
  hostOrUrl?: string | null;
  username?: string | null;
  password?: string | null;
  connectionString?: string | null;
  notes?: string | null;
  appName?: string | null;
  appLink?: string | null;
  accountFirstName?: string | null;
  accountLastName?: string | null;
  accountEmail?: string | null;
  accountRole?: string | null;
  serverVpnRequired?: boolean | null;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  user: UserProfile;
};
