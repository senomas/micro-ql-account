import { Collection, Cursor, Db, MongoClient } from "mongodb";
import { logger } from "./service";

const NODE_ENV = (process.env.NODE_ENV || "production").toLowerCase();

export class MongoModel {
  public db: Db;
  public loadKey = (data: any): any => ({ _id: data._id });
  public loadEnhance = (data: any): any => data;

  constructor(private mongodb: Mongodb, public collection: Collection) {
    this.db = mongodb.db;
  }

  public async insertOne(value, options = null) {
    return this.collection.insertOne(value, options);
  }

  public async updateMany(filter, update, options = null) {
    return this.collection.updateMany(filter, update, options);
  }

  public async deleteMany(filter, options = null) {
    return this.collection.deleteMany(filter, options);
  }

  public async findOne(query, options = null) {
    return this.collection.findOne(query, options);
  }

  public count(query, options = null) {
    return this.collection.countDocuments(query, options);
  }

  public find(query, options = null): Cursor {
    return this.collection.find(query, options);
  }

  public async load(data) {
    if (Array.isArray(data)) {
      const res = [];
      for (const v of data) {
        res.push(await this.load(v));
      }
      return res;
    }
    const res = await this.collection.updateOne(
      await this.loadKey(data), {
      $set: await this.loadEnhance(data)
    }, {
      upsert: true
    });
    return res;
  }
}

export interface MongoModels {
  [key: string]: MongoModel;
}

export class Mongodb {
  public db: Db;
  public models: MongoModels = {};

  public async init(config) {
    const mongoUri = `mongodb://${config.mongodb.user}:${
      config.mongodb.password
      }@${config.mongodb.host}:${config.mongodb.port ||
      "27017"}/${config.mongodb.database || "account"}${
      config.mongodb.params ?
        "?" + Object.entries(config.mongodb.params).map(([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`
        ).join("&") : ""
      }`;
    logger.info({ mongoUri, config: config.mongodb }, "mongoUri");

    this.db = (await MongoClient.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })).db(config.mongodb.database);

    const sequence = this.db.collection("sequence");
    await sequence.createIndex(
      { key: 1, time: 1 },
      {
        unique: true
      }
    );
    const version = this.db.collection("version");
    await version.createIndex(
      { id: 1 },
      {
        unique: true
      }
    );
  }

  public async create(name, options = null) {
    const col = this.db.collection(name);
    if (NODE_ENV === "development" || NODE_ENV === "test") {
      await col.drop();
    }
    const model = this.models[name] = new MongoModel(this, col);
    return model;
  }
}

export const mongodb = new Mongodb();
