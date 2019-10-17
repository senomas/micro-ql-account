import { Authorized, FieldResolver, Resolver, Root } from "type-graphql";

import { UserToken } from "../schemas/auth";

@Resolver(of => UserToken)
export class InboxResolver {

  @FieldResolver(of => String)
  @Authorized(["user.read"])
  public async inboxes(@Root() token: UserToken): Promise<string> {
    return token.name;
  }
}
