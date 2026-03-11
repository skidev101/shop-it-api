export interface UpdateProfilePayload {
  email: string;
  firstname?: string;
  lastname?: string;
  phoneNumber?: string;
  timezone: string;
  addresses?: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
    isDefault: boolean;
  }[];
}