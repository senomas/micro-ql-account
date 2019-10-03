import { Field, ID, ObjectType, ArgsType } from 'type-graphql';
import { Partial, PartialArgs } from './lib';

@ObjectType()
export class Role {
  @Field(type => ID)
  id: string;

  @Field(type => String)
  code: string;

  @Field(type => String)
  name: string;

  @Field(type => String, { nullable: true })
  description: string;

  @Field(type => [String])
  privileges: string[];
}

@ArgsType()
export class FindRoleArgs extends PartialArgs {
  @Field(type => String, { nullable: true })
  code: string;

  @Field(type => String, { nullable: true })
  name: string;

  @Field(type => String, { nullable: true })
  nameRegex: string;
}

@ObjectType()
export class PartialRole extends Partial(Role) {
}
