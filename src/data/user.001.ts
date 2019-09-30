export = async ({ mongodb }) => {
  const db = mongodb.db
  const user = db.collection("user");
  user.createIndex(
    { login: 1 },
    { unique: true }
  );
}
