# TruePulse – AI-Powered News Verification Tool

TruePulse is an intelligent web application designed to combat misinformation by providing a comprehensive analysis of news articles. It helps users verify the authenticity of online content through AI-powered classification, sentiment analysis, and external source verification.

## How It Works

TruePulse analyzes a news article from a given URL through the following steps:

1.  **URL Input**: The user provides a link to a news article.
2.  **Text Extraction**: The Flask backend scrapes the article's text content using `BeautifulSoup`.
3.  **AI Analysis**: A `FakeNewsClassifier` class, leveraging Hugging Face Transformers, performs two key tasks:
    *   **Fake News Detection**: Classifies the article as "Real" or "Fake."
    *   **Sentiment Analysis**: Determines the sentiment of the text (e.g., Positive, Negative, Neutral).
4.  **External Verification**: The application fetches related articles from trusted sources using the News API to provide external context and verification.
5.  **Trust Score Calculation**: A trust score is generated based on the AI classification, source domain reputation, and external verification.
6.  **Display Results**: The React frontend presents a detailed report including the classification, reasoning, sentiment, key topics, and a list of related articles.

## Key Features

-   **AI-Powered Classification**: Determines if an article is likely real or fake with a confidence score.
-   **Comprehensive Analysis**: Provides sentiment analysis, key topic extraction, and detailed reasoning for the classification.
-   **Trust Score**: Offers a simple, at-a-glance credibility metric (0-100).
-   **External Verification**: Fetches related articles from trusted news outlets to help users fact-check and cross-reference information.
-   **Modern UI**: A clean, user-friendly interface for seamless interaction.

## Project Setup and Execution

This project consists of a Python (Flask) backend and a React (Vite) frontend. For the best experience, run each in a separate terminal.

### Prerequisites

-   **Backend**: Python 3.8+
-   **Frontend**: Node.js 18+ and npm

### 1. Clone the Repository

```sh
git clone https://github.com/sumesh-singh/TruePulse.git
cd TruePulse
```

### 2. Set Up and Run the Backend

```sh
# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```

The backend will be available at `http://localhost:5000`.

### 3. Set Up and Run the Frontend

```sh
# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be accessible at `http://localhost:8080` or a similar port.

### 4. Environment Variables

To fetch related articles, the application requires a News API key. You can set it as an environment variable.

-   **Windows**:
    ```sh
    set NEWS_API_KEY=your_key_here
    ```
-   **macOS/Linux**:
    ```sh
    export NEWS_API_KEY=your_key_here
    ```

Get a free key from [newsapi.org](https://newsapi.org/).
