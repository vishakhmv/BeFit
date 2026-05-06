CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    whatsapp_number VARCHAR(15),
    password TEXT NOT NULL,
    dob DATE,
    sex VARCHAR(20),
    food VARCHAR(50),
    cstate VARCHAR(100),
    cdata INT DEFAULT 0,
    analysis_date TIMESTAMP
);
 
CREATE TABLE diet (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    day VARCHAR(20),
    meal_time VARCHAR(10),
    food TEXT,
    completed BOOLEAN DEFAULT FALSE
);
 
CREATE TABLE exercise (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    day VARCHAR(20),
    exercise TEXT,
    completed BOOLEAN DEFAULT FALSE
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

CREATE TABLE password_reset_otp (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 minutes',
    is_verified BOOLEAN DEFAULT FALSE
)