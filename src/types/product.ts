export interface ProductPayload {
  name: string;
  description: string;
  stock: number;
  basePrice: number;
  comparePrice?: number;
  category: string;
  images: Array<{ url: string; public_id: string; isMain: boolean }>;
  variants?: Array<{ name: string; options: string[]; stock: number }>;
  specifications: Array<{ name: string; value: string }>;
  isActive: boolean;
  tags: string[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  basePrice?: number;
  comparePrice?: number | null; // null = explicitly remove comparePrice
  category?: string;
  images: Array<{ url: string; public_id: string; isMain: boolean }>;
  variants?: any[];
  specifications?: Array<{ name: string; value: string }>;
  tags?: string[];
  stock?: number;
  removeImageIds?: string[]; // Cloudinary public_ids the client wants removed
}
