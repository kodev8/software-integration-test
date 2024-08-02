import { IPGUser } from '../../types/pguser.interface';
import type { IMovie, IMovieResponse } from '../../types/movie.interface';

const mockMovie1: IMovie = {
    movie_id: 1,
    title: 'mockMovie1',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster1',
    backdrop_poster: 'backdropPoster1',
    rating: 0, // used for testing lowest rated movie, used for testing rating as it is the only fresh movie
    overview: 'overview1',
};
const mockMovie2: IMovie = {
    movie_id: 2,
    title: 'mockMovie2',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'drama',
    poster: 'poster2',
    backdrop_poster: 'backdropPoster2',
    rating: 0, // same as above
    overview: 'overview2',
};
const mockMovie3: IMovie = {
    movie_id: 3,
    title: 'mockMovie3',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'drama',
    poster: 'poster3',
    backdrop_poster: 'backdropPoster3',
    rating: 3,
    overview: 'overview3',
};
const mockMovie4: IMovie = {
    movie_id: 4,
    title: 'mockMovie4',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'romance',
    poster: 'poster4',
    backdrop_poster: 'backdropPoster4',
    rating: 4,
    overview: 'overview4',
};
const mockMovie5: IMovie = {
    movie_id: 5,
    title: 'mockMovie5',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'romance',
    poster: 'poster5',
    backdrop_poster: 'backdropPoster5',
    rating: 5,
    overview: 'overview5',
};
const mockMovie6: IMovie = {
    movie_id: 6,
    title: 'mockMovie6',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster6',
    backdrop_poster: 'backdropPoster6',
    rating: 4,
    overview: 'overview6',
};

const mockMovie7: IMovie = {
    movie_id: 7,
    title: 'mockMovie7',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster7',
    backdrop_poster: 'backdropPoster7',
    rating: 1,
    overview: 'overview7',
};

const mockMovie8: IMovie = {
    movie_id: 8,
    title: 'mockMovie8',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster8',
    backdrop_poster: 'backdropPoster8',
    rating: 2,
    overview: 'overview8',
};

const mockMovie9: IMovie = {
    movie_id: 9,
    title: 'mockMovie9',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster9',
    backdrop_poster: 'backdropPoster9',
    rating: 3,
    overview: 'overview9',
};

const mockMovie10: IMovie = {
    movie_id: 10,
    title: 'mockMovie10',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster10',
    backdrop_poster: 'backdropPoster10',
    rating: 3,
    overview: 'overview10',
};

const mockMovie11: IMovie = {
    movie_id: 11,
    title: 'mockMovie11',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster11',
    backdrop_poster: 'backdropPoster11',
    rating: 1,
    overview: 'overview11',
};

const mockMovie12: IMovie = {
    movie_id: 12,
    title: 'mockMovie12',
    release_date: new Date('2024-06-18'),
    author: 'tmp',
    type: 'action',
    poster: 'poster12',
    backdrop_poster: 'backdropPoster12',
    rating: 1,
    overview: 'overview12',
};

const mockMovies = [
    mockMovie1,
    mockMovie2,
    mockMovie3,
    mockMovie4,
    mockMovie5,
    mockMovie6,
    mockMovie7,
    mockMovie8,
    mockMovie9,
    mockMovie10,
    mockMovie11,
    mockMovie12,
];

const actionMovies = mockMovies.filter((movie) => movie.type === 'action');
const dramaMovies = mockMovies.filter((movie) => movie.type === 'drama');
const romanceMovies = mockMovies.filter((movie) => movie.type === 'romance');

const moviesAsResp = (movies: IMovie[]): IMovieResponse[] => {
    return movies.map((movie) => ({
        ...movie,
        rating: (Math.round(movie.rating * 100) / 100).toFixed(1),
        release_date: movie.release_date.toISOString().split('T')[0],
    }));
};
const getMoviesSortedByMovieId = (
    movies: IMovieResponse[]
): IMovieResponse[] => {
    return movies.sort((a, b) => a.movie_id - b.movie_id);
};
const getTopRatedMovies = (movies: IMovie[]): IMovie[] => {
    const sortedMovies = movies.sort((a, b) => b.rating - a.rating);
    return sortedMovies.slice(0, 10);
};

const lowestRatedMovie = (movies: IMovie[]): IMovie => {
    const sortedMovies = movies.sort((a, b) => a.rating - b.rating);
    return sortedMovies[0];
};

const getSeenMovies = (user: IPGUser): IMovieResponse[] => {
    const seenMovies = moviesAsResp(
        mockMovies.filter((movie) =>
            user.user_id % 2 === 0
                ? movie.movie_id % 2 === 0
                : movie.movie_id % 2 !== 0
        )
    );
    seenMovies.map((movie) => {
        movie.email = user.email;
    });
    return seenMovies;
};

export {
    mockMovies,
    actionMovies,
    dramaMovies,
    romanceMovies,
    moviesAsResp,
    getTopRatedMovies,
    lowestRatedMovie,
    getSeenMovies,
    getMoviesSortedByMovieId,
};
