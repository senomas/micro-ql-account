export = async ({ mongodb }) => {
  const db = mongodb.db;
  const user = db.collection("user");
  await user.createIndex(
    { login: 1 },
    { unique: true }
  );
};
