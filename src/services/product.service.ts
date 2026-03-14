import mongoose from "mongoose";
import { IProduct, Product, User } from "../models";
import { ProductPayload } from "../types/product";
import { NotFoundError, UnauthorizedError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";
import slugify from "slugify";
import { logger } from "../lib/logger";
import { CloudinaryUtil } from "../utils/cloudinary";
import { nanoid } from "nanoid";
import { imageCleanupQueue } from "../queues/imageCleanup.queue";

export interface ProductQuery {
  page?: number;
  limit?: number;
  isFeatured?: boolean | string | undefined;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest";
}

export class ProductService {
  private async generateUniqueSlug(name: string) {
    const slug = `${slugify(name, { lower: true, strict: true })}-${nanoid(6)}`;

    return slug;
  }

  private generateSku(name: string, category: string): string {
    const catPart = category.substring(0, 3).toUpperCase();
    const namePart = name.substring(0, 3).toUpperCase();

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${catPart}-${namePart}-${randomPart}`;
  }

  async createProduct(
    data: ProductPayload,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const user = await User.findOne({ _id: userId });
    console.log("user from DB in createProduct:", user);
    if (!user) throw new NotFoundError("User");
    if (!user.isVerified) {
      console.log("User account not verified. Cannot create product.");
      throw new UnauthorizedError("User account not verified");
    }
    if (user.isSuspended) {
      console.log("User account suspended. Cannot create product.");
      throw new UnauthorizedError("User account suspended");
    }

    let imageObjects =
      files?.map((file) => ({
        url: file.path,
        public_id: file.filename,
      })) || [];

    try {
      const slug = await this.generateUniqueSlug(data.name);
      const sku = this.generateSku(data.name, data.category);

      const productData: any = {
        uploadedBy: user._id,
        name: data.name,
        slug,
        sku,
        description: data.description,
        basePrice: data.basePrice,
        category: data.category,
        images: imageObjects,
        variants: data.variants,
        specifications: data.specifications,
        tags: data.tags,
        stock: data.stock,
        isActive: true,
        isFeatured: false,
      };

      if (!productData.variants || productData.variants.length === 0) {
        productData.variants = [
          {
            sku: productData.sku,
            price: productData.basePrice,
            stock: productData.stock,
            attributes: [],
            images: [],
          },
        ];
      }

      if (data.comparePrice !== undefined) {
        productData.comparePrice = data.comparePrice;
      }

      console.log("product create payload:", productData);

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
        logger.error("DB error creating product. Cleaning up images...");
        const publicIds = imageObjects.map((img: any) => img.public_id);
        await CloudinaryUtil.deleteMultipleFiles(publicIds);
      }

      throw error;
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
    const safeLimit = Math.min(Number(limit), 50); // Cap limit to 50

    const filter: any = {
      isActive: true,
      deletedAt: null,
    };

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    const featureValue = isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    if (typeof featureValue === "boolean") {
      filter.isFeatured = isFeatured;
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortMap: any = {
      newest: { createdAt: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
    };

    const products = await Product.find(filter)
      .sort(sortMap[sort])
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Product.countDocuments(filter);

    console.log("products fetched:", products)

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
        pages: Math.ceil(total / limit),
      },
      statusCode: 200,
    });
  }

  async getProductBySlug(slug: string) {
    const product = await Product.findOne({ slug, isActive: true })
      .populate("category")
      .populate("uploadedBy", "name email");

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }

  

  async softDeleteProduct(productId: string, userId: string) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, uploadedBy: userId },
      {
        $set: {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!product) {
      throw new NotFoundError("Product not found or unauthorized");
    }

    logger.info(`Product ${productId} moved to trash by ${userId}`);

    return SuccessRes({
      message: "Product soft-deleted",
      statusCode: 200,
    });
  }

  async hardDeleteProduct(productId: string, userId: string) {
    try {
      const product = await Product.findOne({
        _id: productId,
        uploadedBy: userId,
      });

      if (!product) {
        throw new NotFoundError("Product not found or unauthorized");
      }

      const publicIds = [
        ...product.images?.map((img) => img.public_id),
        ...(product.variants ?? []).flatMap((v) =>
          v.images?.map((img) => img.public_id),
        ),
      ];

      await Product.updateOne(
        { _id: productId },
        { deletedAt: new Date(), isActive: false },
      );

      if (publicIds.length > 0) {
        await imageCleanupQueue.add(
          "delete-product-images",
          { publicIds, productId },
          {
            jobId: `product-delete-${productId}-${Date.now()}`,
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: 1000,
          },
        );
      }

      return SuccessRes({
        message: "Product deleted",
        statusCode: 200,
      });
    } catch (error) {
      logger.error("Error deleting product:", error);
      throw error;
    }
  }
}

const productService = new ProductService();
export default productService;
