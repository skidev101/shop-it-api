import { Queue } from "bullmq";
import { logger } from "../lib/logger";
import { Product, User, Variant } from "../models";
import { NotFoundError, UnauthorizedError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";

export class VariantService {
  constructor(private readonly queue: Queue) {}

  private generateSku(
    productSlug: string,
    attributes: Record<string, string>,
  ): string {
    const base = productSlug.substring(0, 3).toUpperCase();

    const attrPart = Object.values(attributes)
      .map((val) => val.slice(0, 3).toUpperCase())
      .join("-");

    const uniquePart = Date.now().toString(36).slice(-3).toUpperCase();

    return `${base}-${attrPart}-${uniquePart}`;
  }

  async createProductVariant(
    userId: string,
    productId: string,
    data: any,
    file: Express.Multer.File,
  ) {
    const product = await Product.findOne({ _id: productId });
    if (!product) throw new NotFoundError("Product");
    const user = await User.findOne({ _id: userId });
    console.log("user from DB in createProductVariant:", user);
    if (!user) throw new NotFoundError("User");
    if (!user.isVerified) {
      console.log("User account not verified. Cannot create product.");
      throw new UnauthorizedError("User account not verified");
    }
    if (user.isSuspended) {
      console.log("User account suspended. Cannot create product.");
      throw new UnauthorizedError("User account suspended");
    }

    try {
      const sku = this.generateSku(product.slug, data.attributes);

      const variantData: any = {
        product: product._id,
        sku,
        attributes: data.atributes,
        price: data.price,
        stock: data.stock,
        image: {
          url: file.path,
          public_id: file.filename,
        },
        isActive: true,
      };

      const variant = await Variant.create(variantData);
      await Product.findByIdAndUpdate(product._id, {
        $addToSet: { variants: variant._id },
      });

      return SuccessRes({
        message: "New variant created",
        data: {
          product: variant,
        },
        statusCode: 201,
      });
    } catch (error) {
      logger.error("DB error creating variant. Cleaning up image");
      if (file) {
        await this.queue.add("create-variant-image", {
          productId: "failed-create-product-id",
          publicIds: file.filename,
        });
      }

      throw error;
    }
  }
}
