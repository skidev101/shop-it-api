import { User } from "../models";
import { UpdateProfilePayload } from "../types/user";
import { NotFoundError, ValidationError } from "../utils/api-errors";

export class UserService {
  async updateProfile(data: UpdateProfilePayload, userId: string) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!updatedUser) {
      throw new NotFoundError("User");
    }

    return updatedUser;
  }
}

const userService = new UserService();
export default userService;
