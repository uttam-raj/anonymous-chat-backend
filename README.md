# Anonymous Chat Backend

## Overview

This is the backend of the Anonymous Chat application.

It is built using:

- Node.js
- Express.js
- Socket.IO
- MySQL
- Railway (Deployment)

The backend handles:

- Anonymous user sessions
- Random partner matching
- Real-time messaging
- Skip chat
- End chat
- Disconnect handling
- Message storage
- Rate limiting

---

## Features

- Random anonymous chat
- Real-time communication using Socket.IO
- Store chat messages in MySQL
- Skip current partner
- End chat
- Automatic rematching
- User status management
- Message validation
- Rate limiting

---

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- MySQL
- dotenv
- uuid

---

## Project Structure

server/
│
├── database/
├── middleware/
├── routes/
├── sockets/
├── utils/
├── server.js
├── package.json
└── .env

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Create a .env file

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
PORT=5000
```

Run the project

```bash
npm start
```

or

```bash
npm run dev
```

---

## API

### Test API

```
GET /
```

Returns

```
Anonymous Chat Server Running...
```

---

## Deployment

Backend is deployed on Railway.

---

## Author

Uttam Rajwar
