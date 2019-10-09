import { Field, ID, ObjectType, InputType, Authorized } from 'type-graphql';
import { Partial } from './lib';
import { Length } from "class-validator";

@ObjectType()
export class Inbox {
  @Field(type => ID)
  id: string;

  @Field(type => [String])
  category: string[];

  @Field()
  type: string;

  @Field()
  subject: string;
}

@InputType()
export class AddInboxInput {
  @Field()
  @Length(3, 100)
  code: string;

  @Field(type => [String])
  category: string[];

  @Field()
  type: string;

  @Field()
  subject: string;
}

@ObjectType()
export class PartialInbox extends Partial(Inbox) {
}
