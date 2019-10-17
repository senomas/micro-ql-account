import { ClassType, Field, Int, ObjectType } from "type-graphql";

export function Partial<TItem>(TItemClass: ClassType<TItem>) {

  @ObjectType({ isAbstract: true })
  abstract class PartialClass {
    @Field(type => [TItemClass])
    public items: TItem[];

    @Field(type => Int)
    public total: number;
  }
  return PartialClass;
}

@ObjectType()
export class UpdateResponse {
  @Field(type => Int, { nullable: true })
  public matched: number;

  @Field(type => Int)
  public modified: number;
}

@ObjectType()
export class DeleteResponse {
  @Field(type => Int)
  public deleted: number;
}
