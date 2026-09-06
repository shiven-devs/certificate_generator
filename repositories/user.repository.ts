import { User, type UserDocument } from "@/models/user.model";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmailWithPassword(email: string) {
  return User.findOne({ email }).select("+passwordHash").exec();
}

export async function findUserById(id: string) {
  return User.findById(id).exec();
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  currentSessionId: string;
}) {
  return User.create(input);
}

export async function rotateSessionId(userId: string, sessionId: string) {
  await User.updateOne(
    { _id: userId },
    { $set: { currentSessionId: sessionId } },
  ).exec();
}

export async function clearSessionIfCurrent(userId: string, sessionId: string) {
  await User.updateOne(
    { _id: userId, currentSessionId: sessionId },
    { $set: { currentSessionId: null } },
  ).exec();
}
