import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class Auth {
  @Field(type => String)
  serverKey: string;
}

@ObjectType()
export class Token {
  @Field(type => String)
  seq: number;

  @Field(type => String)
  token: string;

  @Field(type => String)
  refresh: string;
}

@ObjectType()
export class UserToken {
  @Field(type => ID)
  clientKey: string;

  @Field(type => String)
  xlogin: string;

  @Field(type => String)
  name: string;

  @Field(type => [String])
  privileges: string[];
}
