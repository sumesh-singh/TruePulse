from flask import Flask, jsonify, request
from flask_cors import CORS
from transformers import pipeline
import logging
import requests
import os
import re
from datetime import datetime, timedelta
from fake_news_classifier import FakeNewsClassifier


# Create Flask application instance
app = Flask(__name__)

# Enable CORS for all routes and origins
# In production, you should specify allowed origins for security
CORS(app, origins=["http://localhost:3000",
     "http://localhost:3001", "http://127.0.0.1:3000"])

# For development, you can also use CORS(app) to allow all origins
# CORS(app)

# NewsAPI configuration
# Set your API key as environment variable
NEWS_API_KEY = os.environ.get(
    'NEWS_API_KEY', '21e2fd56540241069992ea6b8243f6c8')
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Initialize the fake news detection pipeline
try:
    classifier = FakeNewsClassifier()
    app.logger.info("Fake news detection model loaded successfully")
except Exception as e:
    app.logger.error(f"Failed to load model: {e}")
    classifier = None

# Root endpoint


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "Welcome to the Flask server!",
        "status": "Server is running successfully",
        "port": 5000
    })

# Optional: Add a health check endpoint


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

# POST endpoint for fake news detection


@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        if classifier is None:
            app.logger.error("Model not available: classifier is None")
            return jsonify({"error": "Model not available. Backend failed to load the classifier. Check server logs for details."}), 500

        data = request.get_json()
        if not data or 'text' not in data:
            app.logger.error("Missing 'text' field in request")
            return jsonify({"error": "Missing 'text' field"}), 400

        # Use the classifier class method
        try:
            result = classifier.classify_text(data['text'])
        except Exception as e:
            app.logger.error(f"Error during classifier.classify_text: {e}")
            return jsonify({
                "error": f"Classifier failed to analyze the text: {str(e)}"
            }), 500

        return jsonify({
            "label": result['label'],
            "score": result['score'],
            "text": data['text'][:100] + "..." if len(data['text']) > 100 else data['text']
        })

    except Exception as e:
        app.logger.error(f"Error in analyze_text: {e}")
        return jsonify({"error": f"Internal server error: {e}"}), 500


def extract_keywords(text, max_keywords=5):
    """Extract keywords from text for news search"""
    # Remove common stop words and punctuation
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}

    # Clean and split text
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    keywords = [word for word in words if word not in stop_words]

    # Return most frequent keywords (simple approach)
    from collections import Counter
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(max_keywords)]

# GET/POST endpoint for finding similar news articles


@app.route('/similar', methods=['GET', 'POST'])
def find_similar_articles():
    try:
        # Check if NewsAPI key is configured
        if not NEWS_API_KEY:
            return jsonify({
                "error": "NewsAPI key not configured. Please set NEWS_API_KEY environment variable."
            }), 500

        # Get text from request
        if request.method == 'POST':
            data = request.get_json()
            if not data or 'text' not in data:
                return jsonify({
                    "error": "Missing 'text' field in JSON request"
                }), 400
            text = data['text']
        else:  # GET request
            text = request.args.get('text', '')

        # Validate text input
        if not text or not text.strip():
            return jsonify({
                "error": "Text parameter is required and cannot be empty"
            }), 400

        # Extract keywords for search
        keywords = extract_keywords(text)
        if not keywords:
            return jsonify({
                "error": "Could not extract meaningful keywords from text"
            }), 400

        # Create search query
        search_query = ' OR '.join(keywords[:3])  # Use top 3 keywords

        # Set date range (last 30 days)
        from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # Query NewsAPI
        params = {
            'q': search_query,
            'from': from_date,
            'sortBy': 'relevancy',
            'pageSize': 3,
            'language': 'en',
            'apiKey': NEWS_API_KEY
        }

        response = requests.get(NEWS_API_URL, params=params, timeout=10)

        if response.status_code != 200:
            return jsonify({
                "error": f"NewsAPI request failed with status {response.status_code}"
            }), 500

        news_data = response.json()

        if news_data.get('status') != 'ok':
            return jsonify({
                "error": f"NewsAPI error: {news_data.get('message', 'Unknown error')}"
            }), 500

        # Format articles
        articles = []
        for article in news_data.get('articles', []):
            if article.get('title') and article.get('url'):
                articles.append({
                    'title': article['title'],
                    'url': article['url'],
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'published_at': article.get('publishedAt', ''),
                    'description': article.get('description', '')[:200] + '...' if article.get('description') and len(article.get('description', '')) > 200 else article.get('description', '')
                })

        return jsonify({
            'query_text': text[:100] + '...' if len(text) > 100 else text,
            'keywords_used': keywords[:3],
            'articles_found': len(articles),
            'articles': articles
        })

    except requests.RequestException as e:
        app.logger.error(f"Network error in find_similar_articles: {e}")
        return jsonify({
            "error": "Failed to fetch news articles. Please try again later."
        }), 500
    except Exception as e:
        app.logger.error(f"Error in find_similar_articles: {e}")
        return jsonify({
            "error": "Internal server error during news search"
        }), 500


if __name__ == '__main__':
    # Start the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
