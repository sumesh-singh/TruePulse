from flask import Flask, jsonify, request
from flask_cors import CORS
from transformers import pipeline
import logging
import requests
import os
import re
from datetime import datetime, timedelta
from fake_news_classifier import FakeNewsClassifier
from bs4 import BeautifulSoup

# Create Flask application instance
app = Flask(__name__)

# Enable CORS for all routes and origins
CORS(app, origins=["http://localhost:3000", "http://localhost:3001",
     "http://127.0.0.1:3000", "http://localhost:8080"])

# NewsAPI configuration
NEWS_API_KEY = os.environ.get(
    'NEWS_API_KEY', '21e2fd56540241069992ea6b8243f6c8')
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Initialize the sentiment analysis classifier
try:
    classifier = FakeNewsClassifier()
    app.logger.info("Sentiment analysis model loaded successfully")
except Exception as e:
    app.logger.error(f"Failed to load model: {e}")
    classifier = None

# Initialize summarization model at startup
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    app.logger.info("Summarization model loaded successfully")
except Exception as e:
    app.logger.error(f"Failed to load summarizer model: {e}")
    summarizer = None

# Sample external "database" (in real life, use an actual DB)
TRUSTED_NEWS_DOMAINS = {"bbc.co.uk", "nytimes.com",
                        "reuters.com", "apnews.com", "npr.org", "theguardian.com"}
UNTRUSTED_NEWS_DOMAINS = {"yourscvnews.com", "worldtruth.tv",
                          "abcnews.com.co", "theonion.com"}  # Example satire/fake

def domain_from_url(url: str) -> str:
    from urllib.parse import urlparse
    try:
        domain = urlparse(url).netloc.lower()
        domain = domain.lstrip('www.')
        return domain
    except Exception:
        return ""

def calculate_trust_score(domain: str) -> dict:
    if not domain:
        # Can't tell, treat as neutral
        return {"score": 50, "status": "Unknown"}
    if domain in TRUSTED_NEWS_DOMAINS:
        return {"score": 95, "status": "Trusted"}
    if domain in UNTRUSTED_NEWS_DOMAINS:
        return {"score": 10, "status": "Untrusted"}
    # Simple goldilocks rule for demo
    if ".gov" in domain or ".edu" in domain:
        return {"score": 90, "status": "Trusted"}
    if ".co" in domain or ".blog" in domain:
        return {"score": 30, "status": "Suspicious"}
    return {"score": 60, "status": "Unknown"}

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "message": "News Analytics API is running!",
        "status": "Server is running successfully",
        "port": 5000,
        "endpoints": ["/analyze", "/similar", "/health"]
    })

# Ensure ONLY ONE health endpoint exists
@app.route('/health', methods=['GET'])
def health_check():
    # The model_status gives clarity to the frontend on backend readiness.
    # This endpoint should ALWAYS return 200, never 500, to prevent frontend "offline" status unless server is really down.
    model_loaded = classifier is not None and getattr(
        classifier, 'classifier', None) is not None
    model_status = "loaded" if model_loaded else "not loaded"
    status = "healthy" if model_loaded else "degraded"

    return jsonify({
        "status": status,
        "model_status": model_status,
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        if classifier is None or classifier.classifier is None:
            app.logger.error("Model not available: classifier is None")
            return jsonify({
                "error": "Sentiment analysis model not available. Please check server logs.",
                "details": "The AI model failed to load on server startup."
            }), 500

        data = request.get_json()
        if not data or 'text' not in data:
            app.logger.error("Missing 'text' field in request")
            return jsonify({"error": "Missing 'text' field in request body"}), 400

        text = data['text'].strip()
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400

        # 1. Check if input is a URL
        url_pattern = re.compile(
            r'^(http|https)://[^\s/$.?#].[^\s]*$', re.IGNORECASE)
        is_url = url_pattern.match(text)
        is_plain_text = False  # we'll use this for the summary origin

        trust_score = None
        trust_status = None
        trust_reason = None

        if is_url:
            try:
                # Fetch page content
                resp = requests.get(text, timeout=10)
                if resp.status_code != 200:
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}"
                    }), 400
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")

                # Try to extract news-like text (get <article> tag content, fallback to <p> tags)
                article = soup.find("article")
                article_text = ""
                if article:
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in article.find_all("p")])
                if not article_text:
                    ps = soup.find_all("p")
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps])

                article_text = article_text.strip()
                if len(article_text.split()) < 50:
                    return jsonify({
                        "error": "Could not extract article text from the provided URL. Please ensure it's a valid news article."
                    }), 400

                summary_input = article_text
                domain = domain_from_url(text)
                trust_info = calculate_trust_score(domain)
                trust_score = trust_info["score"]
                trust_status = trust_info["status"]
                if trust_status == "Trusted":
                    trust_reason = "This source is recognized as a reputable news outlet."
                elif trust_status == "Untrusted":
                    trust_reason = "This domain is on a known list of unreliable/fake news or satire sites."
                elif trust_status == "Suspicious":
                    trust_reason = "Caution: this domain is commonly used for blogs or alternative sources and may not be reliable."
                else:
                    trust_reason = "Source could not be confidently classified; exercise your own judgment."
                text = article_text  # override input with fetched content

            except Exception as e:
                app.logger.error(f"Failed to fetch or process the URL: {e}")
                return jsonify({
                    "error": f"Unable to fetch article content from the provided URL: {str(e)}"
                }), 400
        else:
            # If not a URL, basic trust assignment: Unknown
            url_like = re.match(r'^.+\.[a-z]{2,}(/.*)?$', text)
            if url_like:
                return jsonify({
                    "error": "Input looks like a URL, but not starting with http(s)://. Please provide a full and valid news article link."
                }), 400
            is_plain_text = True
            summary_input = text
            trust_status = "Unknown"
            trust_score = 50
            trust_reason = "No source website provided, so credibility cannot be determined."

        # Generate summary if summarizer is loaded and content is long enough
        summary_text = ""
        summary_error = ""
        if summarizer is not None:
            wc = len(summary_input.split())
            if wc > 40:  # Only summarize if length makes sense, minimum
                try:
                    # The summarizer returns a list of dicts with 'summary_text'
                    summary_result = summarizer(summary_input, max_length=130, min_length=30, do_sample=False)
                    summary_text = summary_result[0]['summary_text']
                except Exception as e:
                    summary_error = f"Failed to summarize text: {str(e)}"
                    app.logger.error(summary_error)
            else:
                summary_text = "Text is too short to generate a meaningful summary."
        else:
            summary_text = "Summarization model not available."

        # Use the classifier to analyze sentiment
        try:
            result = classifier.classify_text(text)
            
            # If summary already generated above, replace default in result (i.e., override model summary with actual summary)
            response = {
                "sentiment": result['sentiment'],
                "confidence": result['confidence'],
                "keyTopics": result['keyTopics'],
                "summary": summary_text,
                "label": result['label'],
                "score": result['score'],
                "wordCount": result['word_count'],
                "text": text[:100] + "..." if len(text) > 100 else text,
                "analysis_timestamp": datetime.now().isoformat(),
                "trust_score": trust_score,
                "trust_status": trust_status,
                "trust_reason": trust_reason
            }
            if summary_error:
                response["summary_error"] = summary_error

            app.logger.info(f"Successfully analyzed text with sentiment: {result['sentiment']} | Trust: {trust_status}")
            return jsonify(response)

        except Exception as e:
            app.logger.error(f"Error during sentiment analysis: {e}")
            return jsonify({
                "error": f"Sentiment analysis failed: {str(e)}",
                "details": "The model encountered an error while processing your text."
            }), 500

    except Exception as e:
        app.logger.error(f"Error in analyze_text endpoint: {e}")
        return jsonify({
            "error": f"Internal server error: {str(e)}",
            "details": "An unexpected error occurred on the server."
        }), 500

def extract_keywords(text, max_keywords=5):
    """Extract keywords from text for news search"""
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}

    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    keywords = [word for word in words if word not in stop_words]

    from collections import Counter
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(max_keywords)]

@app.route('/similar', methods=['GET', 'POST'])
def find_similar_articles():
    try:
        if not NEWS_API_KEY:
            return jsonify({
                "error": "NewsAPI key not configured. Please set NEWS_API_KEY environment variable."
            }), 500

        if request.method == 'POST':
            data = request.get_json()
            if not data or 'text' not in data:
                return jsonify({
                    "error": "Missing 'text' field in JSON request"
                }), 400
            text = data['text']
        else:
            text = request.args.get('text', '')

        if not text or not text.strip():
            return jsonify({
                "error": "Text parameter is required and cannot be empty"
            }), 400

        keywords = extract_keywords(text)
        if not keywords:
            return jsonify({
                "error": "Could not extract meaningful keywords from text"
            }), 400

        search_query = ' OR '.join(keywords[:3])
        from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        params = {
            'q': search_query,
            'from': from_date,
            'sortBy': 'relevancy',
            'pageSize': 5,
            'language': 'en',
            'apiKey': NEWS_API_KEY
        }

        response = requests.get(NEWS_API_URL, params=params, timeout=10)

        if response.status_code != 200:
            app.logger.error(f"NewsAPI request failed with status {response.status_code}")
            return jsonify({
                "error": f"NewsAPI request failed with status {response.status_code}"
            }), 500

        news_data = response.json()

        if news_data.get('status') != 'ok':
            app.logger.error(f"NewsAPI error: {news_data.get('message', 'Unknown error')}")
            return jsonify({
                "error": f"NewsAPI error: {news_data.get('message', 'Unknown error')}"
            }), 500

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

@app.route('/summarize', methods=['POST'])
def summarize_text():
    try:
        if summarizer is None:
            return jsonify({
                "error": "Summarization model is not available on the server."
            }), 503
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request body"}), 400
        text = data['text'].strip()
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400

        url_pattern = re.compile(
            r'^(http|https)://[^\s/$.?#].[^\s]*$', re.IGNORECASE)
        if url_pattern.match(text):
            try:
                resp = requests.get(text, timeout=10)
                if resp.status_code != 200:
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}"
                    }), 400
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")
                article = soup.find("article")
                article_text = ""
                if article:
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in article.find_all("p")])
                if not article_text:
                    ps = soup.find_all("p")
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps])
                article_text = article_text.strip()
                if len(article_text.split()) < 40:
                    return jsonify({
                        "error": "Could not extract enough article text from the provided URL to create a meaningful summary."
                    }), 400
                summary_input = article_text
            except Exception as e:
                return jsonify({
                    "error": f"Unable to fetch article content from the provided URL: {str(e)}"
                }), 400
        else:
            words = text.split()
            if len(words) < 40:
                return jsonify({
                    "error": "Text is too short to generate a meaningful summary. Please provide a longer article."
                }), 400
            summary_input = text

        try:
            summary_result = summarizer(summary_input, max_length=130, min_length=30, do_sample=False)
            summary_text = summary_result[0]['summary_text']
        except Exception as e:
            return jsonify({
                "error": f"Failed to summarize text: {str(e)}"
            }), 500

        return jsonify({
            "summary": summary_text
        })
    except Exception as e:
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
