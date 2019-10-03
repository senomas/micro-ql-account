import { Collection, Cursor, Db, MongoClient } from "mongodb";
import { logger } from "./service";

export class MongoModel {
  public db: Db;
  public collection: Collection;
  public loadKey = (data: any): any => ({ _id: data._id });
  public loadEnhance = (data: any): any => data;

  constructor(private mongodb: Mongodb, public name: string, options: any = {}) {
    this.db = mongodb.db;
    this.collection = this.db.collection(name);
    this.mongodb.models[name] = this;
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
        res.push(this.load(v));
      }
      return res;
    }
    return this.collection.updateOne(
      await this.loadKey(data), {
      $set: await this.loadEnhance(data)
    }, {
      upsert: true
    });
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
}

export const mongodb = new Mongodb();
