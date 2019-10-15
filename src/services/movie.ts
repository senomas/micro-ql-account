import { mongodb } from './mongodb';

export async function initMovie() {
  const movie = await mongodb.create("movie");
  movie.loadKey = (data) => ({ title: data.title });
}
