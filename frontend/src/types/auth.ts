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
  full_name: string;
};
