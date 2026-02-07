export interface ProductPayload {
  name: string;
  description: string;
  stock: number;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  variants?: Array<{name: string; options: string[]; stock: number}>;
  specifications: Record<string, string>;
  isActive: boolean;
  tags: string[]
}