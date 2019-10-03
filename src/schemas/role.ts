import { Field, ID, ObjectType, ArgsType, InputType } from 'type-graphql';
import { Partial, PartialArgs } from './lib';

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
export class NewRoleInput {
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

@ArgsType()
export class FindRoleArgs extends PartialArgs {
  @Field({ nullable: true })
  filter?: FilterRoleInput;
}

@ArgsType()
export class UpdateRoleArgs {
  @Field({ nullable: true })
  filter?: FilterRoleInput;

  @Field()
  data: UpdateRoleInput;
}

@ObjectType()
export class PartialRole extends Partial(Role) {
}
