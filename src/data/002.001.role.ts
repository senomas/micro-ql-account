export = async ({ mongodb }) => {
  const db = mongodb.db
  const role = db.collection("role");
  await role.createIndex(
    { code: 1 },
    { unique: true }
  );
  await role.createIndex(
    { name: 1 },
    { unique: true }
  );
}
