
from transformers import pipeline
import logging

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
            # Use a proper sentiment analysis model
            self.classifier = pipeline(
                'sentiment-analysis',
                model='cardiffnlp/twitter-roberta-base-sentiment-latest',
                return_all_scores=True
            )
            logger.info("✓ Sentiment analysis model loaded successfully")
        except Exception as e:
            logger.error(f"✗ Failed to load sentiment model: {e}")
            # Fallback to a basic sentiment model
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

        # Load fake news detection model
        try:
            logger.info("Loading fake news detection model...")
            self.fake_news_detector = pipeline(
                'text-classification',
                model='mrm8488/bert-tiny-finetuned-fake-news-detection',
                return_all_scores=True
            )
            logger.info("✓ Fake news detection model loaded successfully")
        except Exception as e:
            logger.error(f"✗ Failed to load fake news detection model: {e}")
            # Fallback to a simpler approach
            try:
                self.fake_news_detector = pipeline(
                    'text-classification',
                    model='distilbert-base-uncased-finetuned-sst-2-english',
                    return_all_scores=True
                )
                logger.info("✓ Fallback fake news detection model loaded successfully")
            except Exception as fallback_error:
                logger.error(f"✗ Failed to load fallback fake news detection model: {fallback_error}")
                self.fake_news_detector = None

    def calculate_trust_score(self, fake_news_result, sentiment_result):
        """Calculate a trust score based on fake news detection and sentiment analysis"""
        base_score = 50  # Default neutral score
        
        if fake_news_result:
            # If detected as fake, lower the trust score significantly
            if fake_news_result['label'].upper() in ['FAKE', 'LABEL_1']:
                base_score = max(10, base_score - (fake_news_result['score'] * 40))
            else:  # Real news
                base_score = min(90, base_score + (fake_news_result['score'] * 40))
        
        # Adjust based on sentiment (neutral/balanced news is often more trustworthy)
        if sentiment_result and sentiment_result['sentiment']:
            if sentiment_result['sentiment'].lower() == 'neutral':
                base_score += 5  # Slight boost for neutral tone
            elif sentiment_result['confidence'] > 90:  # Very strong sentiment might indicate bias
                base_score -= 5
        
        return max(0, min(100, int(base_score)))

    def classify_text(self, text):
        """
        Perform sentiment analysis and fake news detection on text

        Args:
            text (str): The text to analyze

        Returns:
            dict: Contains sentiment analysis results, fake news detection, and trust score
        """
        if self.classifier is None:
            raise RuntimeError(
                "Sentiment model not loaded. Cannot perform classification.")

        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        try:
            # Get sentiment analysis results
            sentiment_results = self.classifier(text)

            # If result is a list of lists (when return_all_scores=True), pick the first element
            if isinstance(sentiment_results, list) and len(sentiment_results) > 0 and isinstance(sentiment_results[0], list):
                sentiment_results = sentiment_results[0]

            # Find the result with highest confidence for sentiment
            best_sentiment = max(sentiment_results, key=lambda x: x['score'])

            # Map labels to readable format
            label_mapping = {
                'NEGATIVE': 'Negative',
                'POSITIVE': 'Positive',
                'NEUTRAL': 'Neutral',
                'LABEL_0': 'Negative',
                'LABEL_1': 'Positive',
                'LABEL_2': 'Neutral'
            }

            sentiment = label_mapping.get(best_sentiment['label'].upper(), best_sentiment['label'])

            # Perform fake news detection
            fake_news_result = None
            real_or_fake = "Unknown"
            fake_confidence = 0
            
            if self.fake_news_detector is not None:
                try:
                    fake_results = self.fake_news_detector(text)
                    if isinstance(fake_results, list) and len(fake_results) > 0 and isinstance(fake_results[0], list):
                        fake_results = fake_results[0]
                    
                    fake_news_result = max(fake_results, key=lambda x: x['score'])
                    
                    # Map fake news labels
                    fake_label_mapping = {
                        'FAKE': 'Fake',
                        'REAL': 'Real',
                        'LABEL_0': 'Real',  # Often real is label 0
                        'LABEL_1': 'Fake'   # Often fake is label 1
                    }
                    
                    real_or_fake = fake_label_mapping.get(fake_news_result['label'].upper(), "Unknown")
                    fake_confidence = round(fake_news_result['score'] * 100, 1)
                    
                except Exception as e:
                    logger.error(f"Error during fake news detection: {e}")
                    real_or_fake = "Unknown"
                    fake_confidence = 0

            # Calculate trust score
            trust_score = self.calculate_trust_score(fake_news_result, {
                'sentiment': sentiment,
                'confidence': round(best_sentiment['score'] * 100, 1)
            })

            # Extract key topics (simple keyword extraction)
            words = text.lower().split()
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            key_words = [word.strip('.,!?";') for word in words if len(word) > 4 and word not in stop_words]
            key_topics = list(set(key_words[:5]))  # Get unique top 5 keywords

            if not key_topics:
                key_topics = ['General', 'News', 'Article']

            # Generate summary based on sentiment and fake news detection
            if real_or_fake == 'Fake':
                summary = f"This content appears to be potentially unreliable or fake news with {sentiment.lower()} sentiment."
            elif real_or_fake == 'Real':
                summary = f"This content appears to be legitimate news with {sentiment.lower()} sentiment."
            else:
                summary = f"The article expresses a {sentiment.lower()} sentiment. Authenticity assessment is uncertain."

            return {
                'label': sentiment,
                'score': round(best_sentiment['score'], 4),
                'sentiment': sentiment,
                'confidence': round(best_sentiment['score'] * 100, 1),
                'real_or_fake': real_or_fake,
                'fake_confidence': fake_confidence,
                'trust_score': trust_score,
                'keyTopics': key_topics,
                'summary': summary,
                'all_scores': [
                    {
                        'label': label_mapping.get(result['label'].upper(), result['label']),
                        'score': round(result['score'], 4)
                    }
                    for result in sentiment_results
                ],
                'text_length': len(text),
                'word_count': len(text.split())
            }

        except Exception as e:
            logger.error(f"Error during classification: {e}")
            raise RuntimeError(f"Classification failed: {e}")
