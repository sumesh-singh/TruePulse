from transformers import pipeline
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FakeNewsClassifier:
    def __init__(self):
        """Initialize the sentiment analysis and fake news detection pipelines"""
        self.classifier = None
        self.fake_news_detector = None
        self.load_models()

    def load_models(self):
        """Load the HuggingFace transformers pipelines for sentiment analysis and fake news detection"""
        try:
            logger.info("Loading sentiment analysis model...")
            self.classifier = pipeline(
                'sentiment-analysis',
                model='cardiffnlp/twitter-roberta-base-sentiment-latest',
                return_all_scores=True
            )
            logger.info("✓ Sentiment analysis model loaded successfully")
        except Exception as e:
            logger.error(f"✗ Failed to load sentiment model: {e}")
            try:
                self.classifier = pipeline(
                    'sentiment-analysis',
                    model='distilbert-base-uncased-finetuned-sst-2-english',
                    return_all_scores=True
                )
                logger.info("✓ Fallback sentiment analysis model loaded successfully")
            except Exception as fallback_error:
                logger.error(f"✗ Failed to load fallback sentiment model: {fallback_error}")
                self.classifier = None

        # Load fake news detection model (switch to winterForestStump/Roberta-fake-news-detector)
        try:
            logger.info("Loading fake news detection model: winterForestStump/Roberta-fake-news-detector ...")
            self.fake_news_detector = pipeline(
                'text-classification',
                model='winterForestStump/Roberta-fake-news-detector',
                return_all_scores=True
            )
            logger.info("✓ Fake news detection model loaded: winterForestStump/Roberta-fake-news-detector")
        except Exception as e:
            logger.error(f"✗ Failed to load winterForestStump/Roberta-fake-news-detector: {e}")
            # Fallback to previous model (akhooli/fake-news-detection-bert)
            try:
                logger.info("Loading fake news detection model: akhooli/fake-news-detection-bert ...")
                self.fake_news_detector = pipeline(
                    'text-classification',
                    model='akhooli/fake-news-detection-bert',
                    return_all_scores=True
                )
                logger.info("✓ Fallback fake news detection model loaded: akhooli/fake-news-detection-bert")
            except Exception as fallback_error:
                logger.error(f"✗ Failed to load fallback fake news detection model akhooli/fake-news-detection-bert: {fallback_error}")
                # Final fallback
                try:
                    self.fake_news_detector = pipeline(
                        'text-classification',
                        model='distilbert-base-uncased-finetuned-sst-2-english',
                        return_all_scores=True
                    )
                    logger.info("✓ Fallback fake news detection model loaded: distilbert-base-uncased-finetuned-sst-2-english")
                except Exception as second_fallback_error:
                    logger.error(f"✗ Failed to load fallback fake news detection model distilbert-base-uncased-finetuned-sst-2-english: {second_fallback_error}")
                    self.fake_news_detector = None
    
    def is_model_loaded(self):
        """Checks if the primary models are loaded and ready."""
        # The fake news detector is the most crucial part.
        return self.fake_news_detector is not None

    def calculate_trust_score(self, fake_news_result, sentiment_result, fallback_reason=None):
    base_score = 50
    model_contrib = 0

    # If fallback is used and not a real authenticity classifier, drop trust
    if fallback_reason:
        # Perhaps a more nuanced drop based on the fallback type, or just aim to remove fallbacks
        return 40 if "fallback" in fallback_reason.lower() else 50

    # Integrate fake_news_result
    if fake_news_result == 'Real':
        model_contrib += 30 # Significant boost for real news
    elif fake_news_result == 'Fake':
        model_contrib -= 40 # Significant penalty for fake news
    else: # e.g., 'Uncertain' or 'Neutral'
        model_contrib += 0 # No change or slight adjustment

    # Integrate sentiment_result more granularly
    # This is just an example; you'd need to define thresholds and impacts
    if sentiment_result == 'Negative' and fake_news_result != 'Fake':
        model_contrib -= 5 # Slightly decrease if negative sentiment in "real" news
    elif sentiment_result == 'Positive' and fake_news_result != 'Real':
        model_contrib -= 5 # Slightly decrease if overly positive sentiment in "fake" news


    # Combine and cap the score
    final_score = base_score + model_contrib
    return max(0, min(100, final_score))


        # Adjust based on sentiment (neutral/balanced news is often more trustworthy)
        if sentiment_result and sentiment_result['sentiment']:
            if sentiment_result['sentiment'].lower() == 'neutral':
                base_score += 5  # Slight boost for neutral tone
            elif sentiment_result['confidence'] > 90:  # Strong sentiment = possible bias
                base_score -= 5

        # Add small random jitter to avoid always showing the same values for demo
        base_score = int(base_score + random.randint(-2,2))
        return max(0, min(100, int(base_score)))

    def classify_text(self, text):
        """
        Perform sentiment analysis and fake news detection on text, with honest debugging/logging.
        Returns all details, including reasoning/explanation.
        """
        if self.classifier is None:
            raise RuntimeError(
                "Sentiment model not loaded. Cannot perform classification.")

        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        try:
            # Sentiment analysis
            sentiment_results = self.classifier(text)
            if isinstance(sentiment_results, list) and len(sentiment_results) > 0 and isinstance(sentiment_results[0], list):
                sentiment_results = sentiment_results[0]

            best_sentiment = max(sentiment_results, key=lambda x: x['score'])
            label_mapping = {
                'NEGATIVE': 'Negative',
                'POSITIVE': 'Positive',
                'NEUTRAL': 'Neutral',
                'LABEL_0': 'Negative',
                'LABEL_1': 'Positive',
                'LABEL_2': 'Neutral'
            }
            sentiment = label_mapping.get(best_sentiment['label'].upper(), best_sentiment['label'])
            sentiment_confidence = round(best_sentiment['score'] * 100, 1)

            # --- HONEST SENTIMENT SANITY CHECK ---

            tragic_keywords = [
                "crash", "crashes", "accident", "accidents", "death", "deaths", "dead", "killed", "killings", "fatal",
                "disaster", "disasters", "fire", "fires", "injury", "injuries", "injured", "collapse", "collapsed",
                "tragedy", "tragedies", "victim", "victims", "explosion", "explosions", "fatality", "fatalities",
                "emergency", "mayday", "plane crash", "derail", "derailed", "wreck", "wreckage", "disastrous",
                "hostage", "attack", "attacks", "bomb", "bombing", "terror", "terrorist", "shooting", "shootings"
            ]
            lower_text = text.lower()
            words_in_text = set(lower_text.replace(".", " ").replace(",", " ").replace("!", " ").replace("?", " ").split())

            is_tragic = False
            for kw in tragic_keywords:
                if " " in kw:
                    if kw in lower_text:
                        is_tragic = True
                        break
                else:
                    if kw in words_in_text:
                        is_tragic = True
                        break

            if sentiment == "Positive" and is_tragic:
                print(f"OVERRIDE: Sentiment set to 'Negative' for tragic news (word matched in keywords list).")
                sentiment = "Negative"
                sentiment_confidence = min(sentiment_confidence, 60.0)

            print("Sentiment model raw results:", sentiment_results)
            print("Best sentiment:", best_sentiment['label'], "->", sentiment, "score:", best_sentiment['score'])

            fake_news_result = None
            real_or_fake = "Unknown"
            fake_confidence = 0
            reasoning = ""
            model_raw_output = None
            fallback_reason = None

            if self.fake_news_detector is not None:
                try:
                    fake_results = self.fake_news_detector(text)
                    if isinstance(fake_results, list) and len(fake_results) > 0 and isinstance(fake_results[0], list):
                        fake_results = fake_results[0]

                    print("Fake news model raw results:", fake_results)

                    label_scores = {r['label'].upper(): r['score'] for r in fake_results}
                    print("Parsed fake news scores:", label_scores)

                    if 'sst-2' in str(self.fake_news_detector.model):
                        fallback_reason = "Fallback model (not trained for news authenticity) used for fake news detection."

                    best_label = max(label_scores, key=label_scores.get)
                    best_score = label_scores[best_label]
                    model_raw_output = label_scores

                    if len(label_scores) > 1:
                        v = list(label_scores.values())
                        if abs(v[0]-v[1]) < 0.15 or 0.45 < best_score < 0.65:
                            real_or_fake = "Uncertain"
                            fake_confidence = round(max(v)*100,1)
                            reasoning = (
                                f"This news article is classified as 'Uncertain' because model scores are close: "
                                f"{[round(x*100,1) for x in v]}%. This indicates the model is not confident."
                            )
                        else:
                            if best_label in ["FAKE", "LABEL_1"] or any(
                                fake in best_label for fake in ["LABEL_1_FAKE", "LABEL_FAKE", "FAKE"]
                            ):
                                real_or_fake = "Fake"
                                fake_confidence = round(best_score*100,1)
                                reasoning = f"The article is classified as 'Fake' with model score {fake_confidence}%."
                            elif best_label in ["REAL", "LABEL_0"] or any(
                                real in best_label for real in ["LABEL_0_REAL", "LABEL_REAL", "TRUE"]
                            ):
                                real_or_fake = "Real"
                                fake_confidence = round(best_score*100,1)
                                reasoning = f"The article is classified as 'Real' with model score {fake_confidence}%."
                            else:
                                real_or_fake = "Unknown"
                                reasoning = "Model could not assign clear authenticity."
                    else:
                        real_or_fake = best_label.title()
                        fake_confidence = round(best_score*100,1)
                        reasoning = f"Model only returned {best_label} with score {fake_confidence}%."

                    fake_news_result = max(fake_results, key=lambda x: x['score'])
                except Exception as e:
                    print("Error during fake news detection:", e)
                    real_or_fake = "Unknown"
                    fake_confidence = 0
                    reasoning = f"AI system error: {str(e)}"

            else:
                fallback_reason = "No fake news detector loaded at all."
                reasoning = "Could not analyze authenticity; model unavailable."

            trust_score = self.calculate_trust_score(fake_news_result, {
                'sentiment': sentiment,
                'confidence': sentiment_confidence
            }, fallback_reason=fallback_reason)

            words = text.lower().split()
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            key_words = [word.strip('.,!?";') for word in words if len(word) > 4 and word not in stop_words]
            key_topics = list(set(key_words[:5])) if key_words else ['General', 'News', 'Article']

            short_summary = ""
            if real_or_fake == 'Fake':
                short_summary = f"Likely fake news ({reasoning.replace('The article is classified as','')})"
            elif real_or_fake == 'Real':
                short_summary = f"Likely legitimate ({reasoning.replace('The article is classified as','')})"
            elif real_or_fake == 'Uncertain':
                short_summary = f"Uncertain authenticity: {reasoning}"
            else:
                short_summary = "Unable to determine authenticity."

            return {
                'label': sentiment,
                'score': round(best_sentiment['score'], 4),
                'sentiment': sentiment,
                'confidence': sentiment_confidence,
                'real_or_fake': real_or_fake,
                'fake_confidence': fake_confidence,
                'trust_score': trust_score,
                'reasoning': reasoning if reasoning else short_summary,
                'keyTopics': key_topics,
                'summary': short_summary,
                'all_scores': [
                    {
                        'label': label_mapping.get(result['label'].upper(), result['label']),
                        'score': round(result['score'], 4)
                    }
                    for result in sentiment_results
                ],
                'text_length': len(text),
                'word_count': len(text.split()),
                'model_debug': model_raw_output,
                'fallback_info': fallback_reason
            }

        except Exception as e:
            print(f"Error during classification: {e}")
            raise RuntimeError(f"Classification failed: {e}")
