from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FakeNewsClassifier:
    def __init__(self):
        """Initialize the fake news classification pipeline"""
        self.classifier = None
        self.load_model()

    def load_model(self):
        """Load the HuggingFace transformers pipeline"""
        try:
            logger.info("Loading fake news detection model...")
            self.classifier = pipeline(
                'text-classification',
                model='joeddav/xlm-roberta-large-xnli',
                return_all_scores=True
            )
            logger.info("✓ Fake news detection model loaded successfully")
        except Exception as e:
            logger.error(f"✗ Failed to load model: {e}")
            self.classifier = None

    def classify_text(self, text):
        """
        Classify text as fake or real news

        Args:
            text (str): The text to classify

        Returns:
            dict: Contains 'label', 'score', and 'all_scores'
        """
        if self.classifier is None:
            raise RuntimeError(
                "Model not loaded. Cannot perform classification.")

        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        try:
            # Get all classification results
            results = self.classifier(text)

            # Find the result with highest confidence
            best_result = max(results, key=lambda x: x['score'])

            return {
                'label': best_result['label'],
                'score': round(best_result['score'], 4),
                'all_scores': [
                    {
                        'label': result['label'],
                        'score': round(result['score'], 4)
                    }
                    for result in results
                ],
                'text_length': len(text)
            }

        except Exception as e:
            logger.error(f"Error during classification: {e}")
            raise RuntimeError(f"Classification failed: {e}")

# Standalone function version


def classify_text(text):
    """
    Standalone function to classify text using the fake news detection model

    Args:
        text (str): The text to classify

    Returns:
        dict: Contains 'label' and 'score'
    """
    try:
        # Initialize the pipeline
        classifier = pipeline(
            'text-classification',
            model='joeddav/xlm-roberta-large-xnli',
            return_all_scores=True
        )

        # Validate input
        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        # Perform classification
        results = classifier(text)

        # Get the highest confidence result
        best_result = max(results, key=lambda x: x['score'])

        return {
            'label': best_result['label'],
            'score': round(best_result['score'], 4)
        }

    except Exception as e:
        print(f"Error in classify_text: {e}")
        return {
            'label': 'ERROR',
            'score': 0.0,
            'error': str(e)
        }


# Example usage and testing
if __name__ == "__main__":
    print("Testing Fake News Classifier...")
    print("=" * 50)

    # Test texts
    test_texts = [
        "Scientists have discovered a new planet in our solar system.",
        "The President announced new economic policies today.",
        "Breaking: Aliens land in Times Square, demand pizza.",
        "Stock market reaches new highs amid positive earnings reports."
    ]

    # Method 1: Using the class
    print("\n1. Using FakeNewsClassifier class:")
    classifier_obj = FakeNewsClassifier()

    if classifier_obj.classifier is not None:
        for i, text in enumerate(test_texts, 1):
            try:
                result = classifier_obj.classify_text(text)
                print(f"\nTest {i}:")
                print(f"Text: {text}")
                print(f"Label: {result['label']}")
                print(f"Confidence: {result['score']}")
                print(f"All scores: {result['all_scores']}")
            except Exception as e:
                print(f"Test {i} failed: {e}")
    else:
        print("Model failed to load - cannot run tests")

    # Method 2: Using the standalone function
    print("\n\n2. Using standalone classify_text function:")
    for i, text in enumerate(test_texts, 1):
        result = classify_text(text)
        print(f"\nTest {i}:")
        print(f"Text: {text}")
        print(f"Label: {result['label']}")
        print(f"Confidence: {result['score']}")
        if 'error' in result:
            print(f"Error: {result['error']}")

    print("\n" + "=" * 50)
    print("Testing completed!")
