
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import re
import requests
from bs4 import BeautifulSoup

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_text():
    app = current_app
    classifier = app.config.get('classifier')
    summarizer = app.config.get('summarizer')
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

        url_pattern = re.compile(r'^(http|https)://[^\s/$.?#].[^\s]*$', re.IGNORECASE)
        is_url = url_pattern.match(text)
        is_plain_text = False
        if is_url:
            try:
                resp = requests.get(text, timeout=10)
                if resp.status_code != 200:
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}"
                    }), 400
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")

                # Remove advertisement and unrelated sections (ads, promos, related, sponsor)
                removal_selectors = [
                    'aside',
                    '[class*="ad"]', '[id*="ad"]',
                    '[class*="promo"]', '[id*="promo"]',
                    '[class*="related"]', '[id*="related"]',
                    '[class*="sponsor"]', '[id*="sponsor"]',
                    '[class*="sidebar"]', '[id*="sidebar"]',
                    '[class*="recommend"]', '[id*="recommend"]',
                    '[class*="nav"]', '[id*="nav"]',
                    '[class*="footer"]', '[id*="footer"]',
                    '[class*="cookie"]', '[id*="cookie"]',
                    '[class*="newsletter"]', '[id*="newsletter"]',
                ]
                for selector in removal_selectors:
                    for tag in soup.select(selector):
                        tag.decompose()

                # Prefer the <article> tag for main content
                article = soup.find("article")
                article_text = ""
                if article:
                    ps = article.find_all("p")
                    # Remove any nested ads etc. again within <article>
                    for sel in removal_selectors:
                        for tag in article.select(sel):
                            tag.decompose()
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps if p.get_text(strip=True)])
                if not article_text:
                    # Fallback, grab top-level <p>'s (direct children of <body>) only
                    body = soup.body
                    if body:
                        ps = [p for p in body.find_all("p", recursive=True)
                              if p.find_parent(["aside", "footer", "nav", "header"]) is None and
                                 not any(cls for cls in (p.get("class") or []) if "ad" in cls or "promo" in cls or "related" in cls or "sponsor" in cls)]
                        article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps if p.get_text(strip=True)])
                article_text = article_text.strip()
                if len(article_text.split()) < 50:
                    return jsonify({
                        "error": "Could not extract article text from the provided URL. Please ensure it's a valid news article."
                    }), 400
                summary_input = article_text
                text = article_text
            except Exception as e:
                app.logger.error(f"Failed to fetch or process the URL: {e}")
                return jsonify({
                    "error": f"Unable to fetch article content from the provided URL: {str(e)}"
                }), 400
        else:
            url_like = re.match(r'^.+\.[a-z]{2,}(/.*)?$', text)
            if url_like:
                return jsonify({
                    "error": "Input looks like a URL, but not starting with http(s)://. Please provide a full and valid news article link."
                }), 400
            is_plain_text = True
            summary_input = text

        summary_text = ""
        summary_error = ""
        if summarizer is not None:
            wc = len(summary_input.split())
            if wc > 40:
                try:
                    summary_result = summarizer(summary_input, max_length=130, min_length=30, do_sample=False)
                    summary_text = summary_result[0]['summary_text']
                except Exception as e:
                    summary_error = f"Failed to summarize text: {str(e)}"
                    app.logger.error(summary_error)
            else:
                summary_text = "Text is too short to generate a meaningful summary."
        else:
            summary_text = "Summarization model not available."

        try:
            result = classifier.classify_text(text)
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
                "real_or_fake": result['real_or_fake'],
                "fake_confidence": result['fake_confidence'],
                "trust_score": result['trust_score'],
                "fallback_info": result.get('fallback_info', None)   # <-- Add fallback info for frontend
            }
            if summary_error:
                response["summary_error"] = summary_error
            app.logger.info(f"Successfully analyzed text with sentiment: {result['sentiment']}, authenticity: {result['real_or_fake']}")
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
