
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import re
import requests
from bs4 import BeautifulSoup
import research  # Import the new research module

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_text():
    app = current_app
    classifier = app.config.get('classifier')
    summarizer = app.config.get('summarizer')
    try:
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
        extracted_text = ""
        parse_warning = None
        article_url = ""

        if is_url:
            article_url = text
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                resp = requests.get(article_url, timeout=15, headers=headers, allow_redirects=True)
                if resp.status_code == 401:
                    return jsonify({
                        "error": "Access denied: The website requires authentication or blocks automated requests. Please try copying the article text manually."
                    }), 400
                elif resp.status_code == 403:
                    return jsonify({
                        "error": "Access forbidden: The website blocks automated requests. Please try copying the article text manually."
                    }), 400
                elif resp.status_code != 200:
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}. The website may be down or blocking requests."
                    }), 400
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")
                removal_selectors = [
                    'aside', '[class*="ad"]', '[id*="ad"]', '[class*="promo"]', '[id*="promo"]',
                    '[class*="related"]', '[id*="related"]', '[class*="sponsor"]', '[id*="sponsor"]',
                    '[class*="sidebar"]', '[id*="sidebar"]', '[class*="recommend"]', '[id*="recommend"]',
                    '[class*="nav"]', '[id*="nav"]', '[class*="footer"]', '[id*="footer"]',
                    '[class*="cookie"]', '[id*="cookie"]', '[class*="newsletter"]', '[id*="newsletter"]',
                ]
                for selector in removal_selectors:
                    for tag in soup.select(selector):
                        tag.decompose()

                article = soup.find("article")
                article_text = ""
                if article:
                    ps = article.find_all("p")
                    for sel in removal_selectors:
                        for tag in article.select(sel):
                            tag.decompose()
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps if p.get_text(strip=True)])
                if not article_text:
                    body = soup.body
                    if body:
                        ps = [p for p in body.find_all("p", recursive=True)
                              if p.find_parent(["aside", "footer", "nav", "header"]) is None and
                                 not any(cls for cls in (p.get("class") or []) if "ad" in cls or "promo" in cls or "related" in cls or "sponsor" in cls)]
                        article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps if p.get_text(strip=True)])
                article_text = article_text.strip()
                if not article_text or len(article_text.split()) < 30:
                    return jsonify({
                        "error": (
                            "Could not extract sufficient article content from the provided URL. "
                            "The page may be protected, non-standard, or does not contain readable article text. "
                            "Please check the link or try pasting the article text manually."
                        )
                    }), 400
                extracted_text = article_text[:500]
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
            extracted_text = text[:500]
            if len(text.split()) < 30:
                parse_warning = (
                    "The text provided is very short. AI analysis will have low confidence."
                )

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
            
            # New research and trust score calculation
            if is_url:
                trust_score_data = research.calculate_trust_score(text, article_url)
            else:
                # For plain text, we can't get source reputation, so we return a default.
                trust_score_data = {
                    "trust_score": 50,  # Default score for plain text
                    "source_reputation": "N/A",
                    "fact_check": research.fact_check(text)
                }

            response = {
                "sentiment": result['sentiment'],
                "confidence": result['confidence'],
                "keyTopics": result['keyTopics'],
                "summary": summary_text,
                "label": result['label'],
                "score": result['score'],
                "wordCount": result['word_count'],
                "text": text[:100] + "..." if len(text) > 100 else text,
                "extracted_text": extracted_text,
                "parse_warning": parse_warning,
                "analysis_timestamp": datetime.now().isoformat(),
                "real_or_fake": result['real_or_fake'],
                "fake_confidence": result['fake_confidence'],
                "trust_score": trust_score_data['trust_score'],
                "source_reputation": trust_score_data['source_reputation'],
                "fact_check": trust_score_data['fact_check'],
                "fallback_info": result.get('fallback_info', None)
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
