import { Resolver } from 'type-graphql';

import { User, PartialUser, AddUserInput, FilterUserInput, UpdateUserInput } from '../schemas/user';
import { createBaseResolver } from './lib';

@Resolver(of => User)
export class UserResolver extends createBaseResolver({
  suffix: "user",
  typeCls: User,
  partialTypeCls: PartialUser,
  filterInput: FilterUserInput,
  addInput: AddUserInput,
  updateInput: UpdateUserInput
}) {
  constructor() {
    super();
    this.queryFilters.nameRegex = (query, v) => {
      query.name = { $regex: v };
    }
  }
}
