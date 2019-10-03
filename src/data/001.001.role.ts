export = async ({ mongodb }) => {
  const db = mongodb.db
  const role = db.collection("role");
  role.createIndex(
    { code: 1 },
    { unique: true }
  );
  role.createIndex(
    { name: 1 },
    { unique: true }
  );
}
