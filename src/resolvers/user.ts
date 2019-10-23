import { Resolver } from "type-graphql";

import { AddUserInput, FilterUserInput, PartialUser, UpdateUserInput, User, OrderByUserInput } from "../schemas/user";

import { createBaseResolver } from "./lib";

@Resolver(of => User)
export class UserResolver extends createBaseResolver({
  suffix: "user",
  typeCls: User,
  partialTypeCls: PartialUser,
  filterInput: FilterUserInput,
  orderByInput: OrderByUserInput,
  createInput: AddUserInput,
  updateInput: UpdateUserInput
}) {
  constructor() {
    super();
    this.queryFilters.nameRegex = (query, v) => {
      query.name = { $regex: v };
    };
  }
}
