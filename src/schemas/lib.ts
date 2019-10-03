import { Field, ObjectType, ClassType, Int, ArgsType } from 'type-graphql';

export function Partial<TItem>(TItemClass: ClassType<TItem>) {

  @ObjectType({ isAbstract: true })
  abstract class PartialClass {
    @Field(type => [TItemClass])
    items: TItem[];

    @Field(type => Int)
    total: number;
  }
  return PartialClass;
}

@ArgsType()
export class PartialArgs {
  @Field(type => Int, { nullable: true })
  skip: number;

  @Field(type => Int, { nullable: true })
  limit: number;
}
