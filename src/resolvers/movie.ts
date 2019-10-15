import { Resolver } from 'type-graphql';

import { createBaseResolver } from './lib';
import { Movie, PartialMovie, FilterMovieInput, AddMovieInput, UpdateMovieInput } from '../schemas/movie';

@Resolver(of => Movie)
export class MovieResolver extends createBaseResolver({
  suffix: "movie",
  typeCls: Movie,
  partialTypeCls: PartialMovie,
  filterInput: FilterMovieInput,
  addInput: AddMovieInput,
  updateInput: UpdateMovieInput
}) {
  constructor() {
    super();
    this.queryFilters.titleRegex = (query, v) => {
      query.title = { $regex: v };
    }
  }
}
