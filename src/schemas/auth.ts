import { Field, ID, ObjectType, Int } from 'type-graphql';

export interface IAuthService { }

@ObjectType()
export class Auth {
  @Field(type => String)
  serverKey: string;
}

@ObjectType()
export class Token {
  @Field(type => Int)
  seq: number;

  @Field(type => String)
  token: string;

  @Field(type => String)
  refresh: string;
}

@ObjectType()
export class User {
  @Field(type => String)
  id: string;

  @Field(type => String)
  login: string;

  @Field(type => String)
  name: string;
}
