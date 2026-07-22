export type AuthUser = {
  id: string;
  email: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
};

export type ProfileSessionSummary = {
  fullName: string;
  dateOfBirth: string | null;
  biologicalSex: "male" | "female" | "other" | null;
  hasCompletedSetup: boolean;
};

export type SessionResponse = {
  user: AuthUser;
  profile: ProfileSessionSummary | null;
};
