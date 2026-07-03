-- Infinia AI Manual Database Schema
-- -------------------------------------------------------------
-- Import this script into your MySQL database tool (e.g. phpMyAdmin, DBeaver, MySQL Workbench)
-- or execute it directly using the MySQL Command Line:
--   mysql -u root -p < schema.sql
-- -------------------------------------------------------------

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `infinia_ai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `infinia_ai`;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(120)  NOT NULL,
    username    VARCHAR(80)   NOT NULL UNIQUE,
    email       VARCHAR(200)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    tier        VARCHAR(20)   DEFAULT 'FREE',
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Create Chats Table
CREATE TABLE IF NOT EXISTS chats (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    messages    JSON NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Create Library Table
CREATE TABLE IF NOT EXISTS library (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
