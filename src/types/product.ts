export interface ProductPayload {
  name: string;
  description: string;
  stock: number;
  basePrice: number;
  comparePrice?: number;
  category: string;
  images: string[];
  variants?: Array<{name: string; options: string[]; stock: number}>;
  specifications: Array<{ key: string; value: string }>;
  isActive: boolean;
  tags: string[]
}


export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  comparePrice?: number | null; // null = explicitly remove comparePrice
  category?: string;
  variants?: any[];
  specifications?: Array<{ key: string; value: string }>;
  tags?: string[];
  stock?: number;
  removeImageIds?: string[]; // Cloudinary public_ids the client wants removed
}