import { IComment } from '../../models/commentModel';

const mockComment1: IComment = {
    movie_id: 1,
    username: 'John Doe',
    comment: 'First comment',
    title: 'Be a G',
    rating: 5,
    downvotes: 0,
    upvotes: 23,
};

const mockComment2: IComment = {
    movie_id: 2,
    username: 'Jane Doe',
    comment: 'Second comment',
    title: 'Great Movie',
    rating: 4,
    downvotes: 1,
    upvotes: 30,
};

const mockComment3: IComment = {
    movie_id: 3,
    username: 'Alice',
    comment: 'Loved it!',
    title: 'Fantastic!',
    rating: 5,
    downvotes: 0,
    upvotes: 45,
};

const mockComment4: IComment = {
    movie_id: 1,
    username: 'Bob',
    comment: 'Not bad',
    title: 'Good enough',
    rating: 3,
    downvotes: 5,
    upvotes: 15,
};

const mockComment5: IComment = {
    movie_id: 2,
    username: 'Charlie',
    comment: 'Could be better',
    title: 'Okay Movie',
    rating: 2,
    downvotes: 10,
    upvotes: 8,
};

const mockComment6: IComment = {
    movie_id: 3,
    username: 'Dave',
    comment: 'Amazing plot!',
    title: 'Must Watch',
    rating: 5,
    downvotes: 2,
    upvotes: 50,
};

const mockComment7: IComment = {
    movie_id: 1,
    username: 'Eve',
    comment: 'Boring',
    title: 'Not for me',
    rating: 1,
    downvotes: 20,
    upvotes: 5,
};

const mockComment8: IComment = {
    movie_id: 2,
    username: 'Frank',
    comment: 'Pretty good',
    title: 'Enjoyable',
    rating: 4,
    downvotes: 3,
    upvotes: 22,
};

const mockComment9: IComment = {
    movie_id: 3,
    username: 'Grace',
    comment: 'Loved the characters',
    title: 'Great Acting',
    rating: 5,
    downvotes: 0,
    upvotes: 35,
};

const mockComment10: IComment = {
    movie_id: 1,
    username: 'Hank',
    comment: 'Too long',
    title: 'Lengthy but good',
    rating: 3,
    downvotes: 8,
    upvotes: 12,
};

export const zeroRatingComment: IComment = {
    movie_id: 11,
    username: 'Zero',
    comment: 'Zero rating',
    title: 'Zero rating',
    rating: 0,
    downvotes: 0,
    upvotes: 0,
};

export const excessRatingComment: IComment = {
    movie_id: 12,
    username: 'Excess',
    comment: 'Excess rating',
    title: 'Excess rating',
    rating: 6,
    downvotes: 0,
    upvotes: 0,
};

export const mockComments = [
    mockComment1,
    mockComment2,
    mockComment3,
    mockComment4,
    mockComment5,
    mockComment6,
    mockComment7,
    mockComment8,
    mockComment9,
    mockComment10,
];

export const getCommentsByMovieId = (movie_id: number): IComment[] => {
    return mockComments.filter((comment) => comment.movie_id === movie_id);
};
