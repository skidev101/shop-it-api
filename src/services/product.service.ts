import mongoose, { Types } from "mongoose";
import { IProduct, Product, User, Tag } from "../models";
import { ProductPayload, UpdateProductPayload } from "../types/product";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";
import slugify from "slugify";
import { logger } from "../lib/logger";
import { nanoid } from "nanoid";
import { imageCleanupQueue } from "../queues/imageCleanup.queue";
import { CreateProductInput } from "../validators/product.validator";
import { Queue } from "bullmq";

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

class ProductService {
  constructor(private readonly queue: Queue) {}

  private async generateUniqueSlug(name: string) {
    const slug = `${slugify(name, { lower: true, strict: true })}-${nanoid(6)}`;

    return slug;
  }

  private async processTags(tagNames: string[]): Promise<Types.ObjectId[]> {
    const processedTagIds: Types.ObjectId[] = [];

    for (const name of tagNames) {
      const cleanName = name.toLowerCase().trim();
      const slug = slugify(name, { lower: true, strict: true });

      const tag = await Tag.findOneAndUpdate(
        { name: cleanName },
        {
          $set: { name: cleanName, slug },
          $inc: { usageCount: 1 },
        },
        { upsert: true, new: true },
      );
      processedTagIds.push(tag._id as Types.ObjectId);
    }

    return processedTagIds;
  }

  private generateSku(name: string, category: string): string {
    const catPart = category.substring(0, 3).toUpperCase();
    const namePart = name.substring(0, 3).toUpperCase();

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${catPart}-${namePart}-${randomPart}`;
  }

  async createProduct(userId: string, storeId: string, data: ProductPayload) {
    try {
      const slug = await this.generateUniqueSlug(data.name);
      const sku = this.generateSku(data.name, data.category);

      let tagIds: Types.ObjectId[] = [];
      if (data.tags && data.tags.length > 0) {
        tagIds = await this.processTags(data.tags);
      }

      const productData: any = {
        storeId: new Types.ObjectId(storeId),
        name: data.name,
        slug,
        sku,
        description: data.description,
        basePrice: data.basePrice,
        category: data.category,
        images: data.images,
        specifications: data.specifications,
        tags: tagIds,
        stock: data.stock,
        isActive: true,
        isFeatured: false,
      };

      if (data.comparePrice !== undefined) {
        productData.comparePrice = data.comparePrice;
      }

      console.log("product create payload:", productData);

      const product = await Product.create(productData);
      logger.info(
        `Product ${product._id} created by vendor ${userId} for Store ${storeId}`,
      );

      return SuccessRes({
        message: "New Product created",
        data: {
          product: product.toObject(),
        },
        statusCode: 201,
      });
    } catch (error: any) {
      logger.error("Error creating product", error);
      if (data.images.length > 0) {
        logger.error("Error creating product. Cleaning up images...");
        await this.queue.add("create-product-images", {
          productId: "failed-create-product-id",
          publicIds: data.images.map((img) => img.public_id),
        });
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

    const featureValue =
      isFeatured === "true" ? true : isFeatured === "false" ? false : undefined;
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

    // console.log("products fetched:" products);

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
      .populate("storeId", "name logo description isVerified")
      .populate({ path: "variants", match: { isActive: true } });

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return SuccessRes({
      message: "Product fetched",
      data: product,
      statusCode: 200,
    });
  }

  async updateProduct(
    userId: string,
    productId: string,
    storeId: string,
    data: UpdateProductPayload,
  ) {
    const product = await Product.findOne({ _id: productId, isDeleted: false });
    if (!product) throw new NotFoundError("Product");

    if (product.storeId.toString() !== storeId.toString()) {
      throw new UnauthorizedError("You do not own this product");
    }

    const stagedCloudinaryDeletes: string[] = [];

    try {
      if (data.name !== undefined) {
        product.name = data.name;
        product.slug = await this.generateUniqueSlug(data.name);
      }

      if (data.description !== undefined)
        product.description = data.description;
      if (data.basePrice !== undefined) product.basePrice = data.basePrice;
      if (data.specifications !== undefined)
        product.specifications = data.specifications;
      if (data.stock !== undefined) product.stock = data.stock;

      if (data.category !== undefined) {
        product.category = new mongoose.Types.ObjectId(data.category as string);
      }
      if (data.images.length > 0) {
        product.images = data.images;
      }
      if (data.tags !== undefined && data.tags.length > 0) {
        data.tags.forEach((tag) => {
          const tagId = new mongoose.Types.ObjectId(tag);
          if (!product.tags.includes(tagId)) {
            product.tags.push(tagId);
          }
        });
      }
      // null = client explicitly wants to remove the comparePrice field
      if (data.comparePrice !== undefined) {
        if (data.comparePrice === null) {
          product.comparePrice = undefined;
        } else {
          product.comparePrice = data.comparePrice;
        }
      }

      if (data.name !== undefined || data.category !== undefined) {
        const nameForSku = data.name ?? product.name;
        const categoryForSku = String(data.category ?? product.category);
        product.sku = this.generateSku(nameForSku, categoryForSku);
      }

      if (data.removeImageIds?.length) {
        const remainingImages = product.images.filter(
          (img) => !data.removeImageIds!.includes(img.public_id),
        );

        const incomingCount = data.images.length;
        if (remainingImages.length + incomingCount === 0) {
          throw new ValidationError("A product must retain at least one image");
        }

        stagedCloudinaryDeletes.push(...data.removeImageIds);
        product.images = remainingImages;
      }

      if (data.images.length > 0) {
        product.images.push(...data.images);
      }

      let tagIds: Types.ObjectId[] = [];
      if (data.tags && data.tags.length > 0) {
        tagIds = await this.processTags(data.tags);
      }

      if (tagIds.length > 0) {
        tagIds.forEach((tagId) => {
          if (!product.tags.includes(tagId)) {
            product.tags.push(tagId);
          }
        });
      }

      await product.save();

      if (stagedCloudinaryDeletes.length > 0) {
        await this.queue.add("delete-old-images", {
          productId,
          publicIds: stagedCloudinaryDeletes,
        });
      }

      logger.info(
        `Product ${productId} updated by User ${userId} for Store ${storeId}`,
      );

      return SuccessRes({
        message: "Product updated",
        data: { product: product.toObject() },
        statusCode: 200,
      });
    } catch (error: any) {
      if (data.images.length > 0) {
        logger.error(
          "DB error during product update. Rolling back new upload(s)...",
          data.images.length,
        );
        await this.queue.add("rollback-new-images", {
          productId,
          publicIds: data.images.map((img) => img.public_id),
        });
      }

      throw error;
    }
  }

  async updateProductStatus(
    userId: string,
    productId: string,
    storeId: string,
    updates: Partial<Pick<IProduct, "isActive" | "isFeatured">>,
  ) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!product) throw new NotFoundError("Product not found");

    logger.info(
      `Product ${productId} updated by User ${userId} for Store ${storeId}`,
    );
    return SuccessRes({
      message: "Product updated",
      data: product,
      statusCode: 200,
    });
  }

  async softDeleteProduct(userId: string, productId: string, storeId: string) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, storeId },
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

    logger.info(
      `Product ${productId} archived by User ${userId} for Store ${storeId}`,
    );
    return SuccessRes({
      message: "Product soft-deleted",
      statusCode: 200,
    });
  }

  async hardDeleteProduct(userId: string, productId: string, storeId: string) {
    try {
      const product = await Product.findOne({
        _id: productId,
        storeId,
      });

      if (!product) {
        throw new NotFoundError("Product not found or unauthorized");
      }

      const publicIds = [...product.images?.map((img) => img.public_id)];

      await Product.updateOne(
        { _id: productId },
        { deletedAt: new Date(), isActive: false },
      );

      if (publicIds.length > 0) {
        await this.queue.add("delete-product-images", {
          productId,
          publicIds: publicIds,
        });
      }

      logger.info(
        `Product ${productId} Deleted by User ${userId} for Store ${storeId}`,
      );

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

const productService = new ProductService(imageCleanupQueue);
export default productService;
