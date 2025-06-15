
# ... keep existing code (imports, blueprint setup, etc) the same ...

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_text():
    app = current_app
    classifier = app.config.get('classifier')
    summarizer = app.config.get('summarizer')
    try:
        # ... keep existing error/model checks the same ...

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
        extracted_text = ""  # new
        parse_warning = None  # new

        if is_url:
            try:
                resp = requests.get(text, timeout=10)
                if resp.status_code != 200:
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}"
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
                if len(article_text.split()) < 50:
                    parse_warning = (
                        "Article extraction resulted in very little text. "
                        "The analyzed content may be insufficient for reliable AI analysis. "
                        "Please double-check the link or paste the article content yourself."
                    )
                extracted_text = article_text[:500]  # Save a 500-character preview for frontend
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
            response = {
                "sentiment": result['sentiment'],
                "confidence": result['confidence'],
                "keyTopics": result['keyTopics'],
                "summary": summary_text,
                "label": result['label'],
                "score": result['score'],
                "wordCount": result['word_count'],
                "text": text[:100] + "..." if len(text) > 100 else text,
                "extracted_text": extracted_text,           # <--- NEW
                "parse_warning": parse_warning,             # <--- NEW
                "analysis_timestamp": datetime.now().isoformat(),
                "real_or_fake": result['real_or_fake'],
                "fake_confidence": result['fake_confidence'],
                "trust_score": result['trust_score'],
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
