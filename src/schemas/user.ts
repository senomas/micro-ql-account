import { Field, ID, ObjectType, InputType } from 'type-graphql';
import { Partial } from './lib';

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

@InputType()
export class AddUserInput {
  @Field()
  login: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(type => [String])
  roles: string[];
}

@InputType()
export class UpdateUserInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(type => [String])
  roles: string[];
}

@InputType()
export class FilterUserInput {
  @Field(type => ID, { nullable: true })
  id: string;

  @Field({ nullable: true })
  login: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  nameRegex: string;
}

@ObjectType()
export class PartialUser extends Partial(User) {
}
