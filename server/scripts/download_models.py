"""
Download ML Models for Quiz Generator
Pre-downloads all required models to local cache
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def download_spacy_model():
    """Download spaCy English model"""
    try:
        import spacy
        logger.info("📥 Downloading spaCy model: en_core_web_sm...")
        os.system("python -m spacy download en_core_web_sm")
        logger.info("✅ spaCy model downloaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to download spaCy model: {e}")
        return False


def download_sentence_transformer_model():
    """Download SentenceTransformer model (all-MiniLM-L6-v2)"""
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("📥 Downloading SentenceTransformer model: all-MiniLM-L6-v2...")
        logger.info("   (This may take a few minutes, ~80MB)")
        
        # This will download and cache the model
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ SentenceTransformer model downloaded successfully")
        return True
    except ImportError:
        logger.error("❌ sentence-transformers not installed. Install with: pip install sentence-transformers")
        return False
    except Exception as e:
        logger.error(f"❌ Failed to download SentenceTransformer model: {e}")
        return False


def download_t5_model():
    """Download T5-small model (optional)"""
    try:
        from transformers import pipeline
        logger.info("📥 Downloading T5-small model...")
        logger.info("   (This may take a few minutes, ~240MB)")
        
        # This will download and cache the model
        pipe = pipeline(
            "text2text-generation",
            model="t5-small",
            tokenizer="t5-small"
        )
        logger.info("✅ T5-small model downloaded successfully")
        return True
    except ImportError:
        logger.warning("⚠️  transformers not installed. Install with: pip install transformers")
        return False
    except Exception as e:
        logger.error(f"❌ Failed to download T5-small model: {e}")
        return False


def main():
    """Download all models"""
    print("=" * 60)
    print("ML Models Download Script")
    print("=" * 60)
    print()
    
    results = {}
    
    # Download spaCy model
    print("\n[1/3] Downloading spaCy model...")
    results['spacy'] = download_spacy_model()
    
    # Download SentenceTransformer model
    print("\n[2/3] Downloading SentenceTransformer model...")
    results['sentence_transformer'] = download_sentence_transformer_model()
    
    # Download T5 model (optional)
    print("\n[3/3] Downloading T5-small model (optional)...")
    download_t5 = input("Download T5-small model? (y/n, default: n): ").strip().lower()
    if download_t5 == 'y':
        results['t5'] = download_t5_model()
    else:
        logger.info("⏭️  Skipping T5-small model download")
        results['t5'] = None
    
    # Summary
    print("\n" + "=" * 60)
    print("Download Summary")
    print("=" * 60)
    print(f"spaCy:                  {'✅ Success' if results['spacy'] else '❌ Failed'}")
    print(f"SentenceTransformer:    {'✅ Success' if results['sentence_transformer'] else '❌ Failed'}")
    print(f"T5-small:               {'✅ Success' if results['t5'] else '⏭️  Skipped' if results['t5'] is None else '❌ Failed'}")
    print()
    
    if results['spacy'] and results['sentence_transformer']:
        print("✅ Core models downloaded successfully!")
        print("   Quiz generator will now use cached models (much faster!)")
    else:
        print("⚠️  Some models failed to download.")
        print("   Quiz generator will download them on first use (slower first run)")
    
    print()


if __name__ == "__main__":
    main()

