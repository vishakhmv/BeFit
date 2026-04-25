CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    dob DATE,
    food VARCHAR(20),
    sex VARCHAR(20),
    data INT DEFAULT 0,
    analysis_date TIMESTAMP
);

CREATE TABLE diet (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    day VARCHAR(20),
    meal_time VARCHAR(10),
    food TEXT
);

CREATE TABLE exercise (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    day VARCHAR(20),
    exercise TEXT
);

CREATE TABLE sleep (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    sleep_hour VARCHAR(20)
);

CREATE TABLE water (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    water VARCHAR(20)
);