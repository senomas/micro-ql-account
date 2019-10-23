import { Length, MaxLength } from "class-validator";
import { Authorized, Field, ID, InputType, ObjectType } from "type-graphql";

import { Partial } from "./lib";

@ObjectType()
export class Role {
  @Field(type => ID)
  public id: string;

  @Field()
  public code: string;

  @Field()
  public name: string;

  @Field({ nullable: true })
  public description?: string;

  @Field(type => [String])
  public privileges: string[];
}

@InputType()
export class AddRoleInput {
  @Field()
  @Length(3, 100)
  public code: string;

  @Field()
  @Length(3, 100)
  public name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  public description?: string;

  @Field(type => [String])
  public privileges: string[];
}

@InputType()
export class UpdateRoleInput {
  @Field({ nullable: true })
  @Length(3, 100)
  public code: string;

  @Field({ nullable: true })
  @Length(3, 100)
  public name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  public description?: string;

  @Field(type => [String], { nullable: true })
  public privileges: string[];
}

@InputType()
export class FilterRoleInput {
  @Field(type => ID, { nullable: true })
  public id: string;

  @Field({ nullable: true })
  public code: string;

  @Field({ nullable: true })
  public name: string;

  @Field({ nullable: true })
  public nameRegex: string;
}

@ObjectType()
export class PartialRole extends Partial(Role) {
}
