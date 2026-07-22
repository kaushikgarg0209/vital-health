import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** @deprecated Use registerFormSchema for forms */
export const registerSchema = registerFormSchema;

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function toRegisterInput(values: RegisterFormValues) {
  const { confirmPassword: _confirmPassword, ...input } = values;
  return input;
}

export function fieldErrorsFromSchema<T extends z.ZodType>(
  schema: T,
  values: unknown,
): Partial<Record<string, string>> {
  const result = schema.safeParse(values);

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

export function isSchemaValid<T extends z.ZodType>(
  schema: T,
  values: unknown,
): boolean {
  return schema.safeParse(values).success;
}
