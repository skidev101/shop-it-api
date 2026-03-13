import slugify from "slugify";
import {Category} from "../models";
import { SuccessRes } from "../utils/responses";
import { logger } from "../lib/logger";
import { NotFoundError } from "../utils/api-errors";

export class CategoryService {
  async createCategory(userId: string, data: { name: string; description?: string }) {
    const slug = slugify(data.name, { lower: true });
    const category = await Category.create({ ...data, slug});

    logger.info(`Admin ${userId} created a new category: ${data.name}`);

    return SuccessRes({
      message: "New category added",
      data: category
    });
  }

  async getAllCategories() {
    const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 });
    return SuccessRes({
      message: "Categories retrieved successfully",
      data: {
        categories,
      },
    });
  }

  async updateCategory(categoryId: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category")
    }

    if (data.name) {
      category.name = data.name;
      category.slug = slugify(data.name, { lower: true });
    }
    if (data.description !== undefined) {
      category.description = data.description;
    }
    if (data.isActive !== undefined) {
      category.isActive = data.isActive;
    }

    await category.save();

    return SuccessRes({
      message: "Category updated successfully",
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category")
    }

    await category.deleteOne();

    return SuccessRes({
      message: "Category deleted successfully",
    });
}
}


const categoryService = new CategoryService();
export default categoryService