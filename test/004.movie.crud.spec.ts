import "mocha";

import { expect } from "chai";
import { suite, test } from "mocha-typescript";
import { BaseTest, values } from "./base";

@suite
export class MovieCrudTest extends BaseTest {

  @test
  public async testLogin() {
    await this.postLogin("admin", "dodol123");
  }

  @test
  public async testListMovies() {
    const res = await this.post(`{
      movies(skip: 1) {
        total
        items {
          id
          title
          year
          cast
          genres
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListMoviesByTitle() {
    const res = await this.post(`{
      movies(filter: { title: "admin" }) {
        total
        items {
          id
          title
          year
          cast
          genres
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
  }

  @test
  public async testListMoviesByTitleRegex() {
    const res = await this.post(`{
      movies(filter: { titleRegex: "a" }) {
        total
        items {
          id
          title
          year
          cast
          genres
        }
      }
    }`);
    expect(res.status, res.log).to.eql(200);
    expect(res.body, res.log).to.not.haveOwnProperty("errors");
    expect(res.body.data.movies.total, res.log).to.eql(17695);
  }
}
