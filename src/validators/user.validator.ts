import z from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstname: z.string().trim().min(1, "firstname is required").optional(),
    lastname: z.string().trim().min(1, "lastname is required").optional(),
    email: z.email("invalid email format").trim().lowercase().optional(),
    phoneNumber: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
    addresses: z
      .array(
        z.object({
          street: z.string().trim(),
          city: z.string().trim(),
          country: z.string().trim(),
          zipCode: z.string().trim(),
          isDefault: z.boolean().default(false),
        }),
      )
      .refine((addrs) => addrs.filter((a) => a.isDefault).length <= 1, {
        message: "only one address can be default",
      })
      .optional(),
  }),
});
