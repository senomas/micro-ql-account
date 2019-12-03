import { Field, ID, ObjectType, Int } from "type-graphql";

import { Error } from "./account";

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
export class Salt {
  @Field(type => String, { nullable: true })
  public value?: string;

  @Field(type => Error, { nullable: true })
  public error?: Error;
}

@ObjectType()
export class LoginResponse {
  @Field(type => String, { nullable: true })
  public seq?: number;

  @Field(type => String, { nullable: true })
  public token?: string;

  @Field(type => [Error], { nullable: true })
  public errors?: Error[];
}

@ObjectType()
export class Token {
  @Field(type => String, { nullable: true })
  public seq?: number;

  @Field(type => String, { nullable: true })
  public value?: string;

  @Field(type => [Error], { nullable: true })
  public errors?: Error[];
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
  public token?: Token;
}
