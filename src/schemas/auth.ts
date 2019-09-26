import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export default class Keychange {
  @Field(type => String)
  serverKey: string;
}
