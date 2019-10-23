import { Length, MaxLength } from "class-validator";
import { Field, ID, InputType, ObjectType, registerEnumType } from "type-graphql";

import { Partial, OrderByType } from "./lib";

@ObjectType()
export class User {
  @Field()
  public id: string;

  @Field()
  public login: string;

  @Field()
  public name: string;

  @Field(type => [String])
  public roles: string[];
}

@InputType()
export class AddUserInput {
  @Field()
  @Length(3, 100)
  public login: string;

  @Field()
  @Length(3, 100)
  public name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  public description?: string;

  @Field(type => [String])
  public roles: string[];
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @Length(3, 100)
  public login: string;

  @Field({ nullable: true })
  @Length(3, 100)
  public name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  public description?: string;

  @Field(type => [String], { nullable: true })
  public roles: string[];
}

@InputType()
export class FilterUserInput {
  @Field(type => ID, { nullable: true })
  public id: string;

  @Field({ nullable: true })
  public login: string;

  @Field({ nullable: true })
  public name: string;

  @Field({ nullable: true })
  public nameRegex: string;
}

export enum UserField {
  id = 'id', login = 'login', name = 'name'
}
registerEnumType(UserField, { name: 'UserField' });

@InputType()
export class OrderByUserInput {
  @Field(type => UserField)
  field: UserField;

  @Field(type => OrderByType)
  type: OrderByType;
}

@ObjectType()
export class PartialUser extends Partial(User) {
}
