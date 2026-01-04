"""
Quiz Generator - Hybrid Rule-Based + ML Approach
Generate quiz questions from educational content using:
1. Rule-based NLP (baseline/fallback for explainability)
2. spaCy for improved concept extraction (optional)
3. DistilBERT for similarity and distractor ranking (optional)
"""
import re
import random
import uuid
import logging
from typing import List, Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Module-level cache for ML models
_MODEL_CACHE = {
    'spacy_nlp': None,
    'distilbert_model': None,
    'models_loaded': False
}


class QuizGenerator:
    """
    Hybrid Quiz Generator
    
    Combines rule-based NLP (baseline) with lightweight transformer models:
    - Rule-based: Factual correctness, explainability, fallback
    - spaCy: Improved concept extraction (optional)
    - DistilBERT: Sentence similarity and distractor ranking (optional)
    """
    
    def __init__(self, use_ml: bool = True):
        """
        Initialize quiz generator
        
        Args:
            use_ml: Whether to use ML enhancements (spaCy, DistilBERT)
                   If False, uses only rule-based methods
        """
        self.use_ml = use_ml
        self.spacy_nlp = None
        self.distilbert_model = None
        
        if self.use_ml:
            self._initialize_ml()
    
    def _initialize_ml(self):
        """Initialize ML models (spaCy, DistilBERT) with lazy imports and caching"""
        global _MODEL_CACHE
        
        # Use cached models if available
        if _MODEL_CACHE['models_loaded']:
            self.spacy_nlp = _MODEL_CACHE['spacy_nlp']
            self.distilbert_model = _MODEL_CACHE['distilbert_model']
            return
        
        # Initialize spaCy
        try:
            import spacy
            self.spacy_nlp = spacy.load("en_core_web_sm")
            logger.info("✅ spaCy model loaded successfully")
        except Exception as e:
            self.spacy_nlp = None
            logger.warning(f"⚠️  spaCy not available: {e}. Using rule-based concept extraction.")
        
        # Initialize DistilBERT for sentence similarity
        try:
            from sentence_transformers import SentenceTransformer
            model_name = 'all-MiniLM-L6-v2'  # Faster and smaller model
            logger.info(f"📥 Loading DistilBERT model: {model_name} (this may take a moment on first run)...")
            self.distilbert_model = SentenceTransformer(model_name)
            logger.info("✅ DistilBERT model loaded successfully")
        except Exception as e:
            self.distilbert_model = None
            logger.warning(f"⚠️  DistilBERT not available: {e}. Using rule-based distractor selection.")
        
        # Mark models as loaded and cache them
        _MODEL_CACHE['models_loaded'] = True
        _MODEL_CACHE['spacy_nlp'] = self.spacy_nlp
        _MODEL_CACHE['distilbert_model'] = self.distilbert_model
    
    # -------------------------
    # FACT EXTRACTION
    # -------------------------
    
    def extract_facts(self, text: str) -> List[Dict]:
        """
        Extract clean factual sentences from text
        
        Args:
            text: Lesson content text
            
        Returns:
            List of fact dictionaries
        """
        facts = []
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Filter criteria for good facts
            if len(sentence) < 25:
                continue
            
            # Skip questions
            if sentence.endswith('?'):
                continue
            
            # Regex pattern: X is Y, X are Y, X means Y
            match = re.search(r'\b([A-Z][A-Za-z\s]{2,40}?)\s+(is|are|means?)\s+(.{10,100})', sentence)
            if match:
                concept, _, definition = match.groups()
                facts.append({
                    'type': 'definition',
                    'concept': concept.strip(),
                    'answer': definition.strip(),
                    'statement': sentence,
                    'category': 'definition'
                })
            else:
                # Process/action pattern
                match = re.search(r'\b([A-Za-z][A-Za-z\s]{2,40}?)\s+(produces?|creates?|releases?|uses?|requires?)\s+(.{10,100})', sentence)
                if match:
                    concept, verb, desc = match.groups()
                    category = 'output' if verb.lower() in ['produces', 'creates', 'releases'] else 'input'
                    facts.append({
                        'type': 'process',
                        'concept': concept.strip(),
                        'answer': desc.strip(),
                        'statement': sentence,
                        'category': category
                    })
        
        # Remove duplicates
        unique = {}
        for f in facts:
            key = (f['concept'].lower(), f['answer'].lower()[:50])
            if key not in unique:
                unique[key] = f
        
        return list(unique.values())[:20]
    
    # -------------------------
    # DISTRACTOR GENERATION
    # -------------------------
    
    def generate_distractors(self, correct: str, facts: List[Dict], text: str, category: str) -> List[str]:
        """
        Generate distractors from facts in the same category
        
        Args:
            correct: The correct answer text
            facts: List of extracted facts
            text: Original lesson text
            category: Category type for matching
            
        Returns:
            List of 3 distractors
        """
        distractors = []
        
        # Use answers from other facts in the same category
        for f in facts:
            if len(distractors) >= 3:
                break
            
            if f['answer'].lower() != correct.lower() and f['category'] == category:
                distractors.append(f['answer'])
        
        # Fallback generic distractors
        while len(distractors) < 3:
            distractors.append("Not applicable here")
        
        # Rank using BERT if available
        if self.distilbert_model:
            distractors = self._rank_distractors(correct, distractors)
        
        return distractors[:3]
    
    def _rank_distractors(self, correct: str, distractors: List[str]) -> List[str]:
        """
        Rank distractors using DistilBERT semantic similarity
        
        Args:
            correct: Correct answer text
            distractors: List of candidate distractors
            
        Returns:
            Ranked list of distractors
        """
        try:
            all_text = [correct] + distractors
            emb = self.distilbert_model.encode(all_text)
            
            # Calculate similarity scores
            sim = []
            for e in emb[1:]:
                similarity = np.dot(emb[0], e) / (np.linalg.norm(emb[0]) * np.linalg.norm(e))
                sim.append(similarity)
            
            # Sort by similarity (ascending - less similar first)
            ranked = [d for _, d in sorted(zip(sim, distractors))]
            return ranked
        except Exception as e:
            logger.debug(f"BERT ranking failed: {e}")
            return distractors
    
    # -------------------------
    # QUESTION GENERATION
    # -------------------------
    
    def generate_mc_question(self, fact: Dict, all_facts: List[Dict], text: str) -> Optional[Dict]:
        """
        Generate a multiple-choice question from a fact
        
        Args:
            fact: Fact dictionary
            all_facts: All extracted facts (for distractor generation)
            text: Original lesson text
            
        Returns:
            Question dictionary or None if invalid
        """
        # Generate question text based on fact type
        if fact['type'] == 'definition':
            question_text = f"What is {fact['concept']}?"
        else:
            question_text = f"What does {fact['concept']} produce?"
        
        # Generate distractors
        options = [fact['answer']] + self.generate_distractors(
            fact['answer'], 
            all_facts, 
            text, 
            fact['category']
        )
        
        # Shuffle options
        random.shuffle(options)
        correct_index = options.index(fact['answer'])
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question_text,
            'options': options,
            'correct_index': correct_index
        }
    
    def generate_tf_question(self, statement: str, is_true: bool = True) -> Optional[Dict]:
        """
        Generate a true/false question from a statement
        
        Args:
            statement: Complete statement from lesson
            is_true: Whether statement is true (default: True)
            
        Returns:
            Question dictionary or None if invalid
        """
        statement = statement.strip().rstrip('.')
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': f"True or False: {statement}",
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
    
    # -------------------------
    # MAIN GENERATION
    # -------------------------
    
    def generate_questions(self, lesson_text: str, num_questions: int = 10) -> List[Dict]:
        """
        Generate quiz questions from lesson content
        
        Args:
            lesson_text: The lesson text
            num_questions: Number of questions to generate (default: 10)
            
        Returns:
            List of question dictionaries
        """
        # Extract facts
        facts = self.extract_facts(lesson_text)
        
        if not facts:
            logger.warning("No facts extracted from lesson content")
            return []
        
        questions = []
        
        # Calculate question distribution (70% multiple choice, 30% true/false)
        mc_count = int(num_questions * 0.7)
        tf_count = num_questions - mc_count
        
        # Generate multiple choice questions
        for fact in facts[:mc_count]:
            q = self.generate_mc_question(fact, facts, lesson_text)
            if q:
                questions.append(q)
        
        # Generate true/false questions
        for fact in facts[mc_count:mc_count + tf_count]:
            q = self.generate_tf_question(fact['statement'], is_true=True)
            if q:
                questions.append(q)
        
        # Shuffle questions
        random.shuffle(questions)
        
        return questions[:num_questions]


def generate_quiz(content: str, num_questions: int = 10, use_ml: bool = True) -> List[Dict]:
    """
    Main function to generate quiz questions from content
    
    Args:
        content: Lesson content text
        num_questions: Number of questions to generate (default: 10)
        use_ml: Whether to use ML enhancements (default: True)
        
    Returns:
        List of question dictionaries
    """
    gen = QuizGenerator(use_ml=use_ml)
    return gen.generate_questions(content, num_questions)


# Alias for backward compatibility
def generate_quiz_from_content(content: str, num_questions: int = 10, use_ml: bool = True) -> List[Dict]:
    """Alias for generate_quiz for backward compatibility"""
    return generate_quiz(content, num_questions, use_ml)
