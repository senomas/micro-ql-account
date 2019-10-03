import { Field, ID, ObjectType, ArgsType, InputType } from 'type-graphql';
import { PartialArgs, Partial } from './lib';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  login: string;

  @Field()
  name: string;

  @Field(type => [String])
  roles: string[];
}

@ArgsType()
export class FindUserArgs extends PartialArgs {
  @Field(type => String, { nullable: true })
  login: string;

  @Field(type => String, { nullable: true })
  name: string;

  @Field(type => String, { nullable: true })
  nameRegex: string;
}

@ObjectType()
export class PartialUser extends Partial(User) {
}

