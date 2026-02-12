🛠️ QuickFix – On-Demand Service Booking Platform

Connect • Book • Chat • Pay • Done

QuickFix is a modern, real-time service booking platform that connects users with trusted service providers (helpers) for home and professional services.

From booking → chatting → tracking → paying → reviewing — everything happens seamlessly in one place.

Built with ❤️ using Spring Boot + React + WebSockets + Stripe for a fast, secure, and scalable experience.

✨ Features
👥 Roles & Authentication

Separate dashboards for Users and Providers

Secure JWT Authentication

Role-based access control

Admin management panel

📅 Smart Booking System

Book services for specific dates & times

Multiple booking support

Active job tracking

Real-time status updates

💬 Real-Time Communication

WebSocket-based instant chat

Live notifications

Seamless user ↔ provider messaging

💳 Secure Payments

Stripe payment integration

Safe & secure transactions

Earnings dashboard for providers

⭐ Reviews & Ratings

Rate and review providers

Service history tracking

Trust-based marketplace

🗺️ Location & Tracking

Geo-location support

Track active services

Discover nearby providers

📊 Admin Dashboard

Manage users & providers

Platform analytics

System monitoring & controls

🧰 Tech Stack
⚙️ Backend

Java 17

Spring Boot 3

PostgreSQL

Redis (Caching)

Spring Security + JWT

WebSocket (STOMP)

Flyway (Database Migration)

Lombok, Dotenv

🎨 Frontend

React 19

Vite

TailwindCSS

Axios

React Router DOM

Lucide Icons

☁️ Infrastructure & APIs

Docker & Docker Compose

Stripe (Payments)

Cloudinary (Media Storage)

Maps Integration (Leaflet / Google Maps)

🚀 Getting Started
✅ Prerequisites

Make sure you have installed:

Docker & Docker Compose (recommended)

Java 17+

Node.js & npm

PostgreSQL

Redis

🐳 Run with Docker (Recommended)

Clone the repository
git clone https://github.com/yourusername/QuickFix.git

cd QuickFix

Setup environment variables
cp .env.example .env

Note: `spring-dotenv` loads `.env` from the repo root (where this README lives).

Update the .env file with your credentials.

Start the application
docker-compose up --build

Access URLs:
Frontend → http://localhost:3000

Backend → http://localhost:8080

💻 Local Development (Manual Setup)

Backend
cd Backend
./mvnw spring-boot:run

Frontend
cd Frontend
npm install
npm run dev

🔑 Environment Variables

DB_URL – PostgreSQL JDBC URL
DB_USERNAME – Database username
DB_PASSWORD – Database password
REDIS_URL – Redis connection URL (use rediss:// for TLS)
REDIS_USERNAME – Redis username (if required)
REDIS_PASSWORD – Redis password (if required)
REDIS_SSL – Set to true for TLS when using redis://
RABBIT_URL – RabbitMQ connection URL (use amqps:// for TLS)
RABBIT_SSL – Set to true for TLS when using amqp://
CLOUDINARY_CLOUD_NAME – Cloudinary cloud name
CLOUDINARY_API_KEY – Cloudinary API key
CLOUDINARY_API_SECRET – Cloudinary API secret
STRIPE_SECRET_KEY – Stripe secret key

📸 Highlights

✅ Real-time chat with WebSockets
✅ Secure Stripe payments
✅ JWT authentication
✅ Booking & tracking system
✅ Dockerized deployment
✅ Clean scalable architecture

🏗️ Project Structure

QuickFix
├── Backend
├── Frontend
├── docker-compose.yml
└── README.md

🤝 Contributing

Create a new branch, make changes, and open a Pull Request.

git checkout -b feature/AmazingFeature
git commit -m "Add AmazingFeature"
git push origin feature/AmazingFeature

🌟 Roadmap

Mobile app

Push notifications

AI-based provider matching

Advanced analytics

Multi-city scaling

❤️ Made with passion by the QuickFix Team

If you like this project, don’t forget to ⭐ 
