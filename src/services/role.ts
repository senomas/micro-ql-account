import { mongodb } from './mongodb';

export async function initRole() {
  const role = await mongodb.create("role");
  role.loadKey = (data) => ({ code: data.code });
}
