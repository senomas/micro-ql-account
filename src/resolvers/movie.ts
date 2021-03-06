import { Resolver } from "type-graphql";

import { AddMovieInput, FilterMovieInput, Movie, PartialMovie, UpdateMovieInput, OrderByMovieInput } from "../schemas/movie";

import { createBaseResolver } from "./lib";

@Resolver(of => Movie)
export class MovieResolver extends createBaseResolver({
  suffix: "movie",
  typeCls: Movie,
  partialTypeCls: PartialMovie,
  filterInput: FilterMovieInput,
  orderByInput: OrderByMovieInput,
  createInput: AddMovieInput,
  updateInput: UpdateMovieInput
}) {
  constructor() {
    super();
    this.queryFilters.titleRegex = (query, v) => {
      query.title = { $regex: v };
    };
  }
}
