import { MongoModel, mongodb } from './mongodb';

export async function initRole() {
  mongodb.models.role = new MongoModel(mongodb, "role");
  mongodb.models.role.loadKey = (data) => ({ code: data.code });
}
