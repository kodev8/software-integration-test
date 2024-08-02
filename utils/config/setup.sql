CREATE TABLE IF NOT EXISTS movies (
    movie_id SERIAL PRIMARY KEY,
    title varchar(80) NOT NULL,
    release_date date NOT NULL,
    author varchar(80) NOT NULL,
    type varchar(50) NOT NULL,
    poster varchar(255) NOT NULL,
    backdrop_poster varchar(255) NOT NULL,
    overview varchar(2000),
    rating DECIMAL(2, 1) DEFAULT 0,
    CONSTRAINT unique_movie_title_release_date UNIQUE (title, release_date)
);

CREATE TABLE IF NOT EXISTS users
(
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    username character varying(30) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    creation_date date NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS addresses( 
    id SERIAL PRIMARY KEY,
    email varchar(100) REFERENCES users(email),
    country varchar(30) NOT NULL,
    street varchar(100),
    city varchar(20),
    CONSTRAINT unique_email_in_addresses UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS seen_movies (
    email varchar(100) REFERENCES users(email),
    movie_id INT REFERENCES movies(movie_id),
    PRIMARY KEY (email, movie_id)
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;