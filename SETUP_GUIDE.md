# GitTrack Setup Guide

Welcome to GitTrack! Since you've successfully installed Node.js and NPM, the dependencies are installing. 

To get the app fully working with real data (not just the Demo Mode), you will need to set up a few free accounts and get some API keys. This guide will walk you through it step-by-step in simple language.

---

## Step 1: Set up the Database (MongoDB)

GitTrack needs a place to store user profiles and scores. We use MongoDB for this.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a new **Free Cluster** (the default options are fine).
3. Once the cluster is created, click **Connect**.
4. Choose **Drivers** (Node.js).
5. It will give you a connection string that looks something like this:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
6. Replace `<username>` and `<password>` with the database user credentials you created during setup.
7. Open the `.env` file in the root of your `open_source` folder and paste this string next to `MONGODB_URI=`.

---

## Step 2: Set up GitHub Login (OAuth App)

To let users log into your app with their GitHub accounts, you need to register GitTrack with GitHub.

1. Log into GitHub and go to your **Settings**.
2. Scroll down on the left sidebar and click on **Developer settings** (at the very bottom).
3. Click on **OAuth Apps** and then click **New OAuth App**.
4. Fill in the details:
   - **Application name:** GitTrack (or whatever you like)
   - **Homepage URL:** `http://localhost:3000` (This is where your frontend runs locally)
   - **Authorization callback URL:** `http://localhost:5000/api/auth/github/callback` (This is crucial for the login to work)
5. Click **Register application**.
6. On the next screen, you will see a **Client ID**. Copy this.
7. Click **Generate a new client secret** and copy the secret it generates.
8. Open your `.env` file and paste these values:
   - Put the Client ID next to `GITHUB_CLIENT_ID=`
   - Put the Client Secret next to `GITHUB_CLIENT_SECRET=`

---

## Step 3: Get a GitHub Personal Access Token (PAT)

The server needs its own special key to fetch data in the background (like for the nightly score updates), even when users aren't actively clicking around.

1. In GitHub's **Developer settings** (same place as Step 2), click on **Personal access tokens** and then **Fine-grained tokens**.
2. Click **Generate new token**.
3. Name it something like "GitTrack Server Token".
4. For **Expiration**, you can set it to a year so you don't have to keep replacing it.
5. For **Repository permissions**, you don't necessarily need anything if you're only reading public data, but if you want to read your own private data, give it `Read-only` access to `Contents`. 
6. For **Account permissions**, give it `Read-only` access to `Email addresses`.
7. (Alternatively, you can generate a "Tokens (classic)" and check the `read:user` and `repo` boxes).
8. Generate the token, copy it, and paste it in your `.env` file next to `GITHUB_PAT=`.

---

## Step 4: Run the App!

Once you have filled out your `.env` file, make sure it is named exactly `.env` (not `.env.example`).

Now, open your terminal in the `open_source` folder and run:
`npm run dev`

This will start both the backend server (on port 5000) and the frontend website (on port 3000). Open your browser and go to `http://localhost:3000` to see it live!
