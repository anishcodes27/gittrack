# GitTrack 🚀

> **Your GitHub, Scored & Proven.** GitTrack is a modern, enterprise-grade open-source contribution tracker designed to solve the "Green Square" problem by analyzing, scoring, and visualizing meaningful developer impact.

![GitTrack Dashboard Demo](./client/public/logo.png)

## 🌟 The Problem We Solve
Traditional GitHub contribution graphs ("Green Squares") treat every commit equally, allowing developers to inflate their metrics with dummy commits. GitTrack differentiates between basic personal commits and **meaningful, reviewed External Pull Requests**. It scores your open-source impact, tracks your streak, visualizes your tech stack, and ranks you on global institutional leaderboards.

---

## ✨ Key Features
- 🏆 **Institution Leaderboards**: Turn open source into a team sport. Join your college/institution and compete globally based on average Impact Scores.
- 💯 **Advanced Impact Scoring**: 10x heavier weighting for merged External PRs. Tracks commit history, PR merge rate, and code reviews.
- 🎨 **Premium Analytics Profile**: View your 52-week activity heatmap, month-over-month growth sparkline, and top-language radar charts.
- 🤖 **AI Specialty Tags**: Automatically labels you as a "Frontend Developer", "Systems Engineer", etc., based on byte-level analysis of your public repositories.
- 🔍 **Recruiter Search**: Search any GitHub username to generate a comprehensive analytics dashboard on-the-fly—no login required.

---

## 🛠️ Tech Stack
- **Frontend**: React, Vite, React Router, Recharts (for data visualization)
- **Backend**: Express.js (Node.js)
- **Database**: MongoDB Atlas (Mongoose)
- **External APIs**: GitHub REST API & GitHub GraphQL API

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (free tier is fine)
- GitHub OAuth App (for login)
- GitHub Personal Access Token (PAT) for backend GraphQL queries

### 1. Clone the repo
```bash
git clone https://github.com/anishcodes27/gittrack.git
cd gittrack
```

### 2. Install dependencies
Install dependencies for both the root, client, and server:
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Environment Variables
Create a `.env` file in the root directory and copy the contents from `.env.example`. Fill in the required values:
- `MONGODB_URI`
- `SESSION_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_PAT`

### 4. Run the App
Run both the frontend (Vite) and backend (Express) concurrently:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](#) to see open tasks.

## 📝 License
This project is [MIT](./LICENSE) licensed.
