import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";
import Keychange from "../schemas/auth";

@Resolver()
export default class {
  @Query(returns => Keychange)
  keychange(@Arg("clientKey") clientKey: string): Keychange | undefined {
    return {
      serverKey: "xxxxx"
    }
  }
}