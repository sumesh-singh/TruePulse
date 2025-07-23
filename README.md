# TruePulse – News Credibility & AI Analysis Tool

## Project Overview

TruePulse is a web tool that helps users quickly assess the credibility, sentiment, and key topics of news articles or text snippets. Powered by modern AI/ML models, it offers instant fake news detection, summary, and trust/confidence scoring for any pasted news link or text.

---

## Features

- Paste news links OR article text for instant AI analysis
- See credibility ("fake"/"real" with confidence), sentiment, key topics, and summary
- Works on arbitrary news articles (not tied to pre-ranked news sources)
- Connects to similar and reliable news for cross-verification

---

## Quick Start

This project features:

- A **Python (Flask)** backend (with Hugging Face Transformers)
- A **React (Vite, TypeScript)** frontend

**Tip:** Run backend and frontend in two separate terminals.

---

### 1. Prerequisites

**Backend:**

- Python 3.8 or newer ([Download Python](https://www.python.org/downloads/))
- pip (comes with most Python installations)

**Frontend:**

- Node.js 18+ and npm ([Download Node.js](https://nodejs.org/))

**Recommended:**  
Do all setup steps in your own virtual environment (venv/conda for Python, and nvm/nodeenv for Node).

---

### 2. Install & Run Backend (Flask + Transformers)

**a) Clone this repository**

```sh
git clone https://github.com/sumesh-singh/TruePulse.git
cd TruePulse
```

**b) Install backend dependencies**

```sh
# In the project root
pip install -r requirements.txt
# If requirements.txt does not exist run:
pip install flask transformers torch beautifulsoup4 requests
```

**c) Start the backend server**

```sh
# In the project root
python app.py
```

- The backend runs at [http://localhost:5000](http://localhost:5000).
- Health check: [http://localhost:5000/health](http://localhost:5000/health)

**_If you get errors (e.g., torch install fails):_**

- Confirm your Python version: `python --version`
- Make sure `pip` updates packages in the correct Python environment: `which pip`
- If using Apple Silicon (M1/M2) or Windows, see [PyTorch Install Guide](https://pytorch.org/get-started/locally/)

---

### 3. Install & Run Frontend (React/Vite)

**a) Install frontend dependencies**

```sh
# In the project root (where package.json is)
npm install
```

**b) Start frontend development server**

```sh
npm run dev
```

Open your browser and go to: [http://localhost:8080](http://localhost:8080)

**Frontend automatically proxies API requests** (`/analyze`, `/similar`, `/health`) to your local Flask backend.

---

### 4. Environment Variables (NewsAPI, etc)

- The backend uses a NewsAPI key for finding similar articles:  
  Default key is provided, but you can override it by setting the `NEWS_API_KEY` environment variable before running the backend:
  ```
  export NEWS_API_KEY=your_actual_newsapi_key_here
  ```
  [Get your own free NewsAPI key](https://newsapi.org/)

---

### 5. Troubleshooting & Tips

- If you see "Backend offline" on the UI, make sure your backend server is running and listening on port 5000.
- If you modify the backend, restart the server for changes to take effect.
- Windows users: Use `set NEWS_API_KEY=...` instead of `export ...`
- For package issues, confirm you are using correct virtualenv or node version managers.
- Look for errors in the terminal or browser console for more clues.

---

## Deployment & Custom Domain

- You can publish your app to production via . (see project dashboard)
- To connect a custom domain, check .'s docs: https://docs...dev/tips-tricks/custom-domain

---

## Technologies Used

- **Frontend:** React (Vite, TypeScript), Shadcn UI, Tailwind CSS
- **Backend:** Python, Flask, Hugging Face Transformers, Torch

---

## Contributing

- Fork the repo and create a branch.
- Submit a pull request with your change!

---

## Additional Resources

- [. Documentation](https://docs...dev/)
- [Step by Step Project Guide](https://docs...dev/user-guides/quickstart)
- [Join the . Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
