import { Resolver } from "type-graphql";

import { CreateRoleInput, FilterRoleInput, PartialRole, Role, OrderByRoleInput, UpdateRoleInput } from "../schemas/role";

import { createBaseResolver } from "./lib";

@Resolver(of => Role)
export class RoleResolver extends createBaseResolver({
  suffix: "role",
  typeCls: Role,
  partialTypeCls: PartialRole,
  filterInput: FilterRoleInput,
  orderByInput: OrderByRoleInput,
  createInput: CreateRoleInput,
  updateInput: UpdateRoleInput,
}) {
  constructor() {
    super();
    this.queryFilters.nameRegex = (query, v) => {
      query.name = { $regex: v };
    };
  }
}
