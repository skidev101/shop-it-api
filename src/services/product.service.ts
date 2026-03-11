import mongoose from "mongoose";
import { IProduct, Product, User } from "../models";
import { ProductPayload } from "../types/product";
import { NotFoundError, UnauthorizedError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";
import slugify from "slugify";
import { logger } from "../lib/logger";
import { deleteFromCloudinary } from "../utils/cloudinary";

export interface ProductQuery {
  page?: number;
  limit?: number;
  isFeatured?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest";
}

export class ProductService {
  private async generateUniqueSlug(name: string) {
    const baseSlug = slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    const existingProduct = await Product.findOne({ slug });
    if (!existingProduct) return slug;

    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
}

  async createProduct(data: ProductPayload, userId: string, files: Express.Multer.File[]) {
    const user = await User.findOne({ userId });
    if (!user) throw new NotFoundError("User");
    if (!user.isVerified) throw new UnauthorizedError("User account not verified");
    if (user.isSuspended) throw new UnauthorizedError("User account suspended");

    const imageObjects = files.map((file) => ({
      url: file.path,
      public_id: file.filename
    }))

    try {
      const slug = await this.generateUniqueSlug(data.name);
  
      const productData: any = {
        uploadedBy: user._id,
        name: data.name,
        slug,
        description: data.description,
        basePrice: data.price,
        category: data.category,
        images: imageObjects,
        variants: data.variants,
        specifications: data.specifications,
        isActive: true,
        isFeatured: false,
        tags: data.tags,
      };
      
      if (data.comparePrice !== undefined) {
        productData.comparePrice = data.comparePrice;
      }
  
      const product = await Product.create(productData);

      return SuccessRes({
        message: "New Product added",
        data: {
          product: product.toObject(),
        },
        statusCode: 201,
      });

    } catch (error: any) {
      
      if (imageObjects.length > 0) {
        logger.error("DB error creating product. Cleaning up images...")
        await Promise.all(
          imageObjects.map((img: any) => deleteFromCloudinary(img.public_id))
        )
      }

      throw error; // re-throw the original error after cleanup
    }
  }

  async getProducts(query: ProductQuery) {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      search,
      isFeatured,
      sort = "newest",
    } = query;

    const filter: any = {
      isActive: true,
    };

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category)
    }

    if (typeof isFeatured === "boolean") {
      filter.isFeatured = isFeatured;
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {}
      if (minPrice) filter.basePrice.$gte = minPrice
      if (maxPrice) filter.basePrice.$lte = maxPrice
    }

    if (search) {
      filter.$text = { $search: search }
    }

    const sortMap: any = {
      newest: { createdAt: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 }
    }

    const products = await Product.find(filter)
      .sort(sortMap[sort])
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    const formattedResponse = products.map((product: IProduct) => {
      const productData = product.toObject();

      return {
        id: productData._id,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        stock: productData.stock,
        price: productData.price,
        comparePrice: productData.comparePrice,
        category: productData.category,
        images: productData.images,
        variants: productData.variants,
        specifications: productData.specifications,
        isActive: productData.isActive,
        isFeatured: productData.isFeatured,
        tags: productData.tags,
        createdAt: productData.createdAt,
      };
    });

    return SuccessRes({
      message: "Products fetched",
      data: {
        products: formattedResponse,
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      statusCode: 200,
    });
  }

  async getProductBySlug(slug: string) {
    const product = await Product.findOne({ slug, isActive: true })
      .populate("category")
      .populate("uploadedBy", "name email")

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product
  }
}


const productService = new ProductService();
export default productService;