import { IProduct, Product, User } from "../models";
import { ProductPayload } from "../types/product";
import { NotFoundError, UnauthorizedError } from "../utils/api-errors";
import { SuccessRes } from "../utils/responses";

export interface ProductQuery {
  page: number;
  limit: number;
  isFeatured: true;
}

export class ProductService {
  async createProduct(data: ProductPayload, userId: string) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.isVerified) {
      throw new UnauthorizedError("User account not verified");
    }

    if (user.isSuspended) {
      throw new UnauthorizedError("User cannot perform this operation");
    }

    const product = await Product.create({
      uploadedBy: user._id,
      name: data.name,
      slug: "hello",
      description: data.description,
      stock: data.stock,
      price: data.price,
      comparePrice: data.comparePrice,
      category: data.category,
      images: data.images,
      variants: data.variants,
      specifications: data.specifications,
      isActive: true,
      isFeatured: false,
      tags: data.tags,
    });

    return SuccessRes({
      message: "New Product added",
      data: {
        product: product.toObject(),
      },
      statusCode: 201,
    });
  }

  async getProducts(query: ProductQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.isFeatured) {
      filter.isFeatured = query.isFeatured;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const productsCount = await Product.countDocuments(filter);

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
        createdAt: productData.createdAt
      }
    });

    return SuccessRes({
      message: "Products fetched",
      data: {
        products: formattedResponse,
        total: productsCount
      },
      statusCode: 200
    })
  }

  async getProduct(id: string) {
    const product = await Product.findOne({ _id: id });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    
  }
}
