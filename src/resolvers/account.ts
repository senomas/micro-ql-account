import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import { Account } from "../schemas/account";

@Resolver(of => Account)
export default class {
  @Query(returns => Account, { nullable: true })
  accounts(@Arg("name") name: string): Account | undefined {
    return {
      id: "123",
      name: "xxxxx"
    };
  }
}