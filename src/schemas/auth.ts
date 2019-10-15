import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Auth {
  @Field(type => String)
  serverKey: string;
}

@ObjectType()
export class Commit {
  @Field()
  hash: String;

  @Field()
  abbrevHash: String;

  @Field()
  subject: String;

  @Field()
  authorName: String;

  @Field()
  authorDate: Date;
}

@ObjectType()
export class ServerInfo {
  @Field()
  host: string;

  @Field()
  time: Date;

  @Field()
  buildTime: Date;

  @Field(type => [Commit])
  commits: Commit[];
}

@ObjectType()
export class Token {
  @Field(type => String)
  seq: number;

  @Field(type => String)
  token: string;
}

@ObjectType()
export class UserToken {
  @Field(type => Date, { nullable: true })
  time: Date;

  @Field(type => ID, { nullable: true })
  clientKey: string;

  @Field(type => String, { nullable: true })
  xlogin: string;

  @Field(type => String, { nullable: true })
  name: string;

  @Field(type => [String], { nullable: true })
  privileges: string[];

  @Field(type => Token, { nullable: true })
  token: Token;
}
