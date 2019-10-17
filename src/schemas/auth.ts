import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Auth {
  @Field(type => String)
  public serverKey: string;
}

@ObjectType()
export class Commit {
  @Field()
  public hash: string;

  @Field()
  public abbrevHash: string;

  @Field()
  public subject: string;

  @Field()
  public authorName: string;

  @Field()
  public authorDate: Date;
}

@ObjectType()
export class ServerInfo {
  @Field()
  public host: string;

  @Field()
  public time: Date;

  @Field()
  public buildTime: Date;

  @Field(type => [Commit])
  public commits: Commit[];
}

@ObjectType()
export class Token {
  @Field(type => String)
  public seq: number;

  @Field(type => String)
  public token: string;
}

@ObjectType()
export class UserToken {
  @Field(type => Date, { nullable: true })
  public time: Date;

  @Field(type => ID, { nullable: true })
  public clientKey: string;

  @Field(type => String, { nullable: true })
  public xlogin: string;

  @Field(type => String, { nullable: true })
  public name: string;

  @Field(type => [String], { nullable: true })
  public privileges: string[];

  @Field({ nullable: true })
  public issuedAt: Date;

  @Field({ nullable: true })
  public expiredAt: Date;

  @Field(type => Token, { nullable: true })
  public token: Token;
}
