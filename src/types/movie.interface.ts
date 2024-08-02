interface Movie {
    movie_id: number;
    title: string;
    author: string;
    type: string;
    poster: string;
    backdrop_poster: string;
    overview: string;
}

export interface IMovie extends Movie {
    release_date: Date;
    rating: number;
}

export interface IMovieResponse extends Movie {
    email?: string;
    release_date: string;
    rating: string | number;
}
