<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" /></a>
</p>

<h1 align="center">News API Backend</h1>

## Description

A robust, production-ready RESTful API built with [NestJS](https://nestjs.com/). This project serves as the backend for a news platform where Authors can publish content and Readers can consume it. It features a simple analytics engine to record high-frequency user engagement and process view counts into daily reports for performance tracking.

## Key Features

*   **User Management**: Secure user signup and JWT-based authentication with role-based access control (RBAC) for Authors and Readers.
*   **Content Lifecycle**: Full CRUD operations for articles, including soft-deletion, exclusively for authors.
*   **Public News Feed**: A paginated and filterable public endpoint for readers to discover published articles.
*   **Engagement Tracking**: Asynchronous read tracking for every article view, capturing both registered and guest user interactions.
*   **Analytics Engine**: A background job queue (BullMQ) processes raw read logs into aggregated daily analytics.
*   **Author Dashboard**: A protected endpoint for authors to view performance metrics for their articles, including total view counts.

## Tech Stack

*   **Framework**: [NestJS](https://nestjs.com/)
*   **Database**: [TypeORM](https://typeorm.io/) with a SQL-based database + PostgreSQL
*   **Authentication**: JWT, [Passport.js](http://www.passportjs.org/)
*   **Async Processing**: [BullMQ](https://bullmq.io/) for background jobs
*   **Validation**: `class-validator`, `class-transformer`
*   **API Documentation**: Swagger

## Project structure

All backend **source and config** live in the **`/backend`** folder. The **README**, **`.gitignore`**, and **`.env`** files stay at the **project root** (this directory).

```
/
├── .env
├── .gitignore
├── README.md           (this file)
├── package.json        (root scripts)
└── backend/
    ├── src/
    ├── test/
    ├── scripts/
    ├── package.json
    └── ...
```

## API Endpoints

### Auth
*   `POST /auth/signup` - Register a new user (Author or Reader).
*   `POST /auth/login` - Log in and receive a JWT.

### Articles (Public)
*   `GET /articles` - Get a paginated list of published articles. Supports filtering by `category`, `author`, and `q` (keyword).
*   `GET /articles/:id` - Get a single article by its ID. Triggers a read event.

### Articles (Author-Only)
*   `POST /articles` - Create a new article (defaults to Draft status).
*   `GET /articles/me` - Get a paginated list of articles written by the authenticated author.
*   `PUT /articles/:id` - Update an article.
*   `DELETE /articles/:id` - Soft-delete an article.

### Analytics (Author-Only)
*   `GET /author/dashboard` - View engagement metrics for the authenticated author's articles.

## Installation

## Running Locally

To get the application running on your local machine, follow these steps.

**Prerequisites**:
You must have [Node.js](https://nodejs.org/), [PostgreSQL](https://www.postgresql.org/), and [Redis](https://redis.io/) installed.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Kelele-m3/backend.git
    cd backend
    ```

2.  **Install dependencies** (from project root):
    ```bash
    cd backend
    npm install
    ```

3.  **Configure Environment**
    Create a **`.env`** file in the **project root** (same level as this README). The application loads it from there.
    ```env
    # PostgreSQL
    DATABASE_HOST='localhost'
    DATABASE_PORT='5432'
    DATABASE_USERNAME='your db user name'
    DATABASE_PASSWORD='your db password'
    DATABASE_NAME='news_api'

    # Redis
    REDIS_HOST=localhost
    REDIS_PORT=6379

    # Authentication
    JWT_SECRET=your-super-secret-and-long-jwt-secret
    ```

4.  **Create the database**
    This script uses the variables from your root `.env` file.
    ```bash
    npm run create:db
    ```
    (Run from project root; the script runs in `backend/` and reads `../.env`.)

5.  **Set up Database Schema**
    This project is configured to use TypeORM's `synchronize` feature for development. It will automatically create the database tables based on your entity files when the application starts up.

    > **Note**: `synchronize` is not suitable for production environments. For production, you should use TypeORM Migrations.

6.  **Run the application**
    From **project root**:
    ```bash
    npm run start
    ```
    Or from the **backend** folder:
    ```bash
    cd backend
    npm run start
    ```
    The application will be available at http://localhost:3000

## API Documentation

Once the application is running, you can explore the API endpoints and interact with them through the Swagger documentation, available at http://localhost:3000/api.
