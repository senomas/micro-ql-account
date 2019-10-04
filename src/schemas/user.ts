import { Field, ID, ObjectType, InputType } from 'type-graphql';
import { Partial } from './lib';
import { Length, MaxLength } from 'class-validator';

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
  @Length(3, 100)
  login: string;

  @Field()
  @Length(3, 100)
  name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field(type => [String])
  roles: string[];
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @Length(3, 100)
  login: string;

  @Field({ nullable: true })
  @Length(3, 100)
  name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field(type => [String], { nullable: true })
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
