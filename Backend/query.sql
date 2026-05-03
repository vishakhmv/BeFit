CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(15),
    password TEXT NOT NULL,
    dob DATE,
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

CREATE TABLE executive_summary (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    future_outlook TEXT,
    key_focus_areas JSONB,
    dietary_focus TEXT,
    estimated_calories VARCHAR(100),
    estimated_protein VARCHAR(100),
    lifestyle_advice TEXT
);

CREATE TABLE blood_results (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    extracted_name VARCHAR(255),
    expanded_name VARCHAR(255),
    test_value VARCHAR(100),
    status VARCHAR(50),
    issues TEXT,
    why_it_happens TEXT,
    summary TEXT,
    what_if_low TEXT,
    what_if_high TEXT
);