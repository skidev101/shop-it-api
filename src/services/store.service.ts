import slugify from "slugify";
import { Store } from "../models/Store";
import { ValidationError, NotFoundError } from "../utils/api-errors";
import { nanoid } from "nanoid";
import { SuccessRes } from "../utils/responses";
import { Queue } from "bullmq";

export class StoreService {
  constructor(private readonly queue: Queue) {}

  private async generateSlug(name: string) {
    const baseSlug = slugify(name, { lower: true, strict: true });
    const slug = `${baseSlug}-${nanoid(6)}`;

    return slug;
  }

  async createStore(
    userId: string,
    data: { name: string; description: string },
  ) {
    const existing = await Store.findOne({ ownerId: userId });
    if (existing) throw new ValidationError("You already own a store");

    const slug = await this.generateSlug(data.name);

    const store = await Store.create({
      ownerId: userId,
      name: data.name,
      slug,
      description: data.description,
    });

    return SuccessRes({
      message: "Store created",
      data: store,
      statusCode: 201,
    });
  }

  async updateStore(userId: string, data: any, file: Express.Multer.File) {
    const store = await Store.findOne({ ownerId: userId });
    if (!store) throw new NotFoundError("Store");

    let updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = await this.generateSlug(data.name);
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (file) {
      const oldImage = store.logo?.public_id;

      updateData.logo = {
        url: file.path,
        public_id: file.filename,
      };

      if (oldImage) {
        await this.queue.add("delete-image", { publicIds: [oldImage] });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return SuccessRes({
        message: "Nothing to update",
        data: store,
      });
    }

    const update = await Store.findByIdAndUpdate(
      store._id,
      { $set: updateData },
      { new: true },
    );

    return SuccessRes({
      message: "Store updated",
      data: update,
    });
  }

  async getStore(userId: string) {
    const store = await Store.findOne({ ownerId: userId });
    if (!store) throw new NotFoundError("Store");

    return SuccessRes({
      message: "Store fetched",
      data: store,
    });
  }
}
