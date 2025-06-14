
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/653957cd-f1a4-4bdb-8e52-84c439e11614

---

## 🚀 Quick Start (Backend + Frontend)

This project includes a React frontend (in this folder) and a Python (Flask) backend (see `app.py` and `fake_news_classifier.py`).

### 1. **Clone the Repository**

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

---

### 2. **Backend Setup (Python/Flask)**

> **Requirements:**  
> - Python 3.8+  
> - pip (Python package manager)  

**a) Install backend dependencies:**  
Navigate to your backend directory (the project root) and install required Python packages:

```sh
pip install -r requirements.txt
```
or, if there is no `requirements.txt` (add if missing by yourself):

```sh
pip install flask transformers torch
```

**b) Start the backend server:**

```sh
python app.py
```
This will start the Flask server at `http://localhost:5000`.

---

### 3. **Frontend Setup (React/Vite)**

> **Requirements:**  
> - Node.js & npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

**a) Install frontend dependencies:**
```sh
npm install
```

**b) Start the frontend development server:**
```sh
npm run dev
```
Frontend runs at `http://localhost:8080` (proxying API calls to backend).

---

### 4. **Open Your App**

Open your browser and go to:
- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend Health: [http://localhost:5000/health](http://localhost:5000/health)

---

## Deploy, Custom Domain, and More

For deployment and custom domains, see Lovable documentation:

- [Publish Your App](https://docs.lovable.dev/user-guides/how-to-deploy)
- [Connect a Custom Domain](https://docs.lovable.dev/tips-tricks/custom-domain)

---

## Troubleshooting

- If backend API is not connecting (shows offline), check the backend server log and ensure it is running.
- If you face Python version or CUDA/torch errors, double-check your Python and pip installations.

---

## What technologies are used for this project?

- Vite, TypeScript, React, shadcn-ui, Tailwind CSS (frontend)
- Flask, Hugging Face Transformers (backend)

---

## Lovable Usage

You can continue editing this code in Lovable by visiting:  
[https://lovable.dev/projects/653957cd-f1a4-4bdb-8e52-84c439e11614](https://lovable.dev/projects/653957cd-f1a4-4bdb-8e52-84c439e11614)

---

## (Advanced) Using your own IDE

You may also open and edit the codebase in VS Code/GitHub Codespaces or your favorite text editor.

