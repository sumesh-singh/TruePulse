
from flask import Flask
from flask_cors import CORS
from transformers import pipeline
import logging
import os

from fake_news_classifier import FakeNewsClassifier

# Create Flask application instance
app = Flask(__name__)

# Enable CORS for all
CORS(app, origins=["http://localhost:3000", "http://localhost:3001",
     "http://127.0.0.1:3000", "http://localhost:8080"])

# NewsAPI configuration
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', '21e2fd56540241069992ea6b8243f6c8')
NEWS_API_URL = "https://newsapi.org/v2/everything"
app.config['NEWS_API_KEY'] = NEWS_API_KEY
app.config['NEWS_API_URL'] = NEWS_API_URL

# Initialize the sentiment analysis classifier
try:
    classifier = FakeNewsClassifier()
    app.logger.info("Sentiment analysis model loaded successfully")
except Exception as e:
    import traceback
    app.logger.error(f"Failed to load model: {e}")
    app.logger.error(traceback.format_exc())
    classifier = None
app.config['classifier'] = classifier

# Initialize summarization model at startup
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    app.logger.info("Summarization model loaded successfully")
except Exception as e:
    import traceback
    app.logger.error(f"Failed to load summarizer model: {e}")
    app.logger.error(traceback.format_exc())
    summarizer = None
app.config['summarizer'] = summarizer

# Register API blueprints
from routes.health import health_bp
from routes.analyze import analyze_bp
from routes.similar import similar_bp
from routes.summarize import summarize_bp

app.register_blueprint(health_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(similar_bp)
app.register_blueprint(summarize_bp)

@app.route('/', methods=['GET'])
def home():
    return {
        "message": "News Analytics API is running!",
        "status": "Server is running successfully",
        "port": 5000,
        "endpoints": ["/analyze", "/similar", "/health", "/summarize"]
    }

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        import traceback
        print(f"FATAL ERROR DURING FLASK STARTUP: {e}")
        print(traceback.format_exc())
