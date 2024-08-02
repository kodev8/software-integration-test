import { IRating } from '../../models/ratingModel';

const mockemail1 = 'johndoe@email.com';
const mockemail2 = 'janedoe@email.com';

const rating1: IRating = {
    email: mockemail1,
    rating: 4,
    movie_id: 1,
    created_at: new Date(),
};

const rating2: IRating = {
    email: mockemail2,
    rating: 5,
    movie_id: 1,
    created_at: new Date(),
};

const rating3: IRating = {
    email: mockemail1,
    rating: 1,
    movie_id: 2,
    created_at: new Date(),
};

const rating4: IRating = {
    email: mockemail2,
    rating: 4,
    movie_id: 2,
    created_at: new Date(),
};

export const latestRating: IRating = {
    email: mockemail1,
    rating: 5,
    movie_id: 1,
    created_at: new Date(),
};

export const ratings: IRating[] = [rating1, rating2, rating3, rating4];

export const avgRating = (
    movieId: number,
    with_latest: boolean = false
): number => {
    const resolvedRatings = with_latest ? [...ratings, latestRating] : ratings;
    const movieRatings = resolvedRatings.filter(
        (rating) => rating.movie_id === movieId
    );
    const sum = movieRatings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / movieRatings.length;
};
