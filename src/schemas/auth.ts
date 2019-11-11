import { Field, ID, ObjectType, Int } from "type-graphql";

@ObjectType()
export class Auth {
  @Field(type => String)
  public serverKey: string;
}

@ObjectType()
export class AuthConfigPbkdf2 {
  @Field(type => Int)
  public iterations: number;

  @Field(type => Int)
  public curves: string;
}

@ObjectType()
export class AuthConfig {
  public salt: string;
  public curves?: string;
  public aesKey?: AuthConfigPbkdf2;
  public aesSalt?: AuthConfigPbkdf2;

  @Field(type => Int)
  public loginExpiry: number;

  @Field(type => Int)
  public sessionExpiry: number;

  @Field(type => Int)
  public tokenExpiry: number;

  public singleSession: Boolean;

  public pbkdf2?: AuthConfigPbkdf2;

  public pbkdf2App?: AuthConfigPbkdf2;
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
