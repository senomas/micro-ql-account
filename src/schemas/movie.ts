import { Length, MaxLength } from "class-validator";
import { Field, ID, InputType, ObjectType, Int } from "type-graphql";
import { Partial } from "./lib";

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

@ObjectType()
export class PartialMovie extends Partial(Movie) {
}
