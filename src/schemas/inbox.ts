import { Length } from "class-validator";
import { Authorized, Field, ID, InputType, ObjectType } from "type-graphql";
import { Partial } from "./lib";

@ObjectType()
export class Inbox {
  @Field(type => ID)
  public id: string;

  @Field(type => [String])
  public category: string[];

  @Field()
  public type: string;

  @Field()
  public subject: string;
}

@InputType()
export class AddInboxInput {
  @Field()
  @Length(3, 100)
  public code: string;

  @Field(type => [String])
  public category: string[];

  @Field()
  public type: string;

  @Field()
  public subject: string;
}

@ObjectType()
export class PartialInbox extends Partial(Inbox) {
}
