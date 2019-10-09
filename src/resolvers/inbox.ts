import { Resolver, Root, Authorized, FieldResolver } from 'type-graphql';

import { UserToken } from '../schemas/auth';

@Resolver(of => UserToken)
export class InboxResolver {

  @FieldResolver(of => String)
  @Authorized(["user.read"])
  async inboxes(@Root() token: UserToken): Promise<String> {
    return token.name;
  }
}