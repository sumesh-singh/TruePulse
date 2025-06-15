
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import requests
from utils import extract_keywords

similar_bp = Blueprint('similar', __name__)

@similar_bp.route('/similar', methods=['GET', 'POST'])
def find_similar_articles():
    app = current_app
    NEWS_API_KEY = app.config['NEWS_API_KEY']
    NEWS_API_URL = app.config['NEWS_API_URL']
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
