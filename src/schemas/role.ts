import { Length, MaxLength } from "class-validator";
import { Field, ID, InputType, ObjectType, registerEnumType } from "type-graphql";

import { Partial, OrderByType } from "./lib";

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

  @Field(type => [String], { nullable: true })
  public privileges: string[];
}

@InputType()
export class CreateRoleInput {
  @Field()
  @Length(3, 100)
  public code: string;

  @Field()
  @Length(3, 100)
  public name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  public description?: string;

  @Field(type => [String], { nullable: true })
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

export enum RoleField {
  id = 'id', code = 'code', name = 'name'
}
registerEnumType(RoleField, { name: 'RoleField' });

@InputType()
export class OrderByRoleInput {
  @Field(type => RoleField)
  field: RoleField;

  @Field(type => OrderByType)
  type: OrderByType;
}

@ObjectType()
export class PartialRole extends Partial(Role) {
}
