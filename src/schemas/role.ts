import { Field, ID, ObjectType, InputType } from 'type-graphql';
import { Partial } from './lib';

@ObjectType()
export class Role {
  @Field(type => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field()
  description?: string;

  @Field(type => [String])
  privileges: string[];
}

@InputType()
export class AddRoleInput {
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
export class UpdateRoleInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(type => [String])
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
