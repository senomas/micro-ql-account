import { Field, ID, ObjectType, ArgsType } from 'type-graphql';
import { PartialArgs, Partial } from './lib';

@ObjectType()
export class User {
  @Field(type => String)
  id: string;

  @Field(type => String)
  login: string;

  @Field(type => String)
  name: string;
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

