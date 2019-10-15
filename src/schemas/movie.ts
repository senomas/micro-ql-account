import { Field, ID, ObjectType, InputType } from 'type-graphql';
import { Partial } from './lib';
import { Length, MaxLength } from 'class-validator';

@ObjectType()
export class Movie {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  year: number;

  @Field(type => [String], { nullable: true })
  cast: string[];

  @Field(type => [String], { nullable: true })
  genres: string[];
}

@InputType()
export class AddMovieInput {
  @Field()
  title: string;

  @Field()
  year: number;

  @Field(type => [String], { nullable: true })
  cast: string[];

  @Field(type => [String], { nullable: true })
  genres: string[];
}

@InputType()
export class UpdateMovieInput {
  @Field()
  title: string;

  @Field()
  year: number;

  @Field(type => [String], { nullable: true })
  cast: string[];

  @Field(type => [String], { nullable: true })
  genres: string[];
}

@InputType()
export class FilterMovieInput {
  @Field(type => ID, { nullable: true })
  id: string;

  @Field({ nullable: true })
  title: string;

  @Field({ nullable: true })
  titleRegex: string;

  @Field({ nullable: true })
  year: number;
}

@ObjectType()
export class PartialMovie extends Partial(Movie) {
}
