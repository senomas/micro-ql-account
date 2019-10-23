import { Length, MaxLength } from "class-validator";
import { Field, ID, InputType, Int, ObjectType, registerEnumType } from "type-graphql";

import { Partial, OrderByType } from "./lib";

@ObjectType()
export class Movie {
  @Field()
  public id: string;

  @Field()
  public title: string;

  @Field(type => Int)
  public year: number;

  @Field(type => [String], { nullable: true })
  public cast: string[];

  @Field(type => [String], { nullable: true })
  public genres: string[];
}

@InputType()
export class AddMovieInput {
  @Field()
  public title: string;

  @Field(type => Int)
  public year: number;

  @Field(type => [String], { nullable: true })
  public cast: string[];

  @Field(type => [String], { nullable: true })
  public genres: string[];
}

@InputType()
export class UpdateMovieInput {
  @Field()
  public title: string;

  @Field(type => Int)
  public year: number;

  @Field(type => [String], { nullable: true })
  public cast: string[];

  @Field(type => [String], { nullable: true })
  public genres: string[];
}

@InputType()
export class FilterMovieInput {
  @Field(type => ID, { nullable: true })
  public id: string;

  @Field({ nullable: true })
  public title: string;

  @Field({ nullable: true })
  public titleRegex: string;

  @Field(type => Int, { nullable: true })
  public year: number;
}

export enum MovieField {
  id = 'id', title = 'title', year = 'year'
}
registerEnumType(MovieField, { name: 'MovieField' });

@InputType()
export class OrderByMovieInput {
  @Field(type => MovieField)
  field: MovieField;

  @Field(type => OrderByType)
  type: OrderByType;
}

@ObjectType()
export class PartialMovie extends Partial(Movie) {
}
