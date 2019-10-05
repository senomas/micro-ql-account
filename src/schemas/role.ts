import { Field, ID, ObjectType, InputType, Authorized } from 'type-graphql';
import { Partial } from './lib';
import { MaxLength, Length } from "class-validator";

@ObjectType()
export class Role {
  @Field(type => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(type => [String])
  privileges: string[];
}

@InputType()
export class AddRoleInput {
  @Field()
  @Length(3, 100)
  code: string;

  @Field()
  @Length(3, 100)
  name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field(type => [String])
  privileges: string[];
}

@InputType()
export class UpdateRoleInput {
  @Field({ nullable: true })
  @Length(3, 100)
  code: string;

  @Field({ nullable: true })
  @Length(3, 100)
  name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field(type => [String], { nullable: true })
  privileges: string[];
}

@InputType()
export class FilterRoleInput {
  @Field(type => ID, { nullable: true })
  id: string;

  @Field({ nullable: true })
  code: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  nameRegex: string;
}

@ObjectType()
export class PartialRole extends Partial(Role) {
}
