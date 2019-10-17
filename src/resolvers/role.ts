import { Resolver } from "type-graphql";

import { AddRoleInput, FilterRoleInput, PartialRole, Role, UpdateRoleInput } from "../schemas/role";
import { createBaseResolver } from "./lib";

@Resolver(of => Role)
export class RoleResolver extends createBaseResolver({
  suffix: "role",
  typeCls: Role,
  partialTypeCls: PartialRole,
  filterInput: FilterRoleInput,
  addInput: AddRoleInput,
  updateInput: UpdateRoleInput
}) {
  constructor() {
    super();
    this.queryFilters.nameRegex = (query, v) => {
      query.name = { $regex: v };
    };
  }
}
