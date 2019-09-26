import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class Account {
  @Field(type => ID)
  id: string;

  @Field(type => String)
  name: string;
}
