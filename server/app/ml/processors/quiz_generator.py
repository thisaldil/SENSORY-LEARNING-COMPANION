"""
Quiz Generator - Hybrid Rule-Based + ML Approach
Generate quiz questions from educational content using:
1. Rule-based NLP (baseline/fallback for explainability)
2. spaCy for improved concept extraction
3. DistilBERT for similarity and distractor ranking
4. T5-small for question rewriting/improvement

IMPROVED VERSION: Fact-first approach with proper templates and structured options
"""
import re
import random
import uuid
import logging
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

# ML Libraries - Lazy imports to avoid module-level errors
# We'll import these only when needed in _initialize_ml_components()
SPACY_AVAILABLE = False
SENTENCE_TRANSFORMERS_AVAILABLE = False
T5_AVAILABLE = False

import numpy as np

logger = logging.getLogger(__name__)

# Module-level cache for ML models (loaded once and reused)
_MODEL_CACHE = {
    'spacy_nlp': None,
    'distilbert_model': None,
    't5_pipeline': None,
    'models_loaded': False
}


class QuizGenerator:
    """
    Hybrid Quiz Generator - Improved Quality Version
    
    Combines rule-based NLP (baseline) with lightweight transformer models:
    - Rule-based: Factual correctness, explainability, fallback
    - spaCy: Improved concept extraction via noun phrases
    - DistilBERT: Sentence similarity and distractor ranking
    - T5-small: Question rewriting for better naturalness
    
    IMPROVED: Uses fact-first approach with proper templates and structured options
    """
    
    def __init__(self, use_ml: bool = True):
        """
        Initialize quiz generator
        
        Args:
            use_ml: Whether to use ML enhancements (spaCy, DistilBERT, T5)
                   If False, uses only rule-based methods
        """
        self.use_ml = use_ml
        
        # Initialize ML components
        self.spacy_nlp = None
        self.distilbert_model = None
        self.t5_pipeline = None
        
        if self.use_ml:
            self._initialize_ml_components()
    
    def _initialize_ml_components(self):
        """Initialize ML models (spaCy, DistilBERT, T5) with lazy imports and caching"""
        global SPACY_AVAILABLE, SENTENCE_TRANSFORMERS_AVAILABLE, T5_AVAILABLE, _MODEL_CACHE
        
        # Use cached models if available
        if _MODEL_CACHE['models_loaded']:
            self.spacy_nlp = _MODEL_CACHE['spacy_nlp']
            self.distilbert_model = _MODEL_CACHE['distilbert_model']
            self.t5_pipeline = _MODEL_CACHE['t5_pipeline']
            return
        
        # Initialize spaCy
        try:
            import spacy
            SPACY_AVAILABLE = True
            try:
                # Try to load the English model
                self.spacy_nlp = spacy.load("en_core_web_sm")
                _MODEL_CACHE['spacy_nlp'] = self.spacy_nlp
                logger.info("✅ spaCy model loaded successfully")
            except OSError:
                logger.warning("⚠️  spaCy model 'en_core_web_sm' not found. "
                             "Install with: python -m spacy download en_core_web_sm")
                self.spacy_nlp = None
        except (ImportError, Exception) as e:
            SPACY_AVAILABLE = False
            logger.warning(f"⚠️  spaCy not available: {e}. Using rule-based concept extraction.")
            self.spacy_nlp = None
        
        # Initialize DistilBERT for sentence similarity
        # Using smaller, faster model: all-MiniLM-L6-v2 (~80MB vs 265MB, much faster)
        try:
            from sentence_transformers import SentenceTransformer
            SENTENCE_TRANSFORMERS_AVAILABLE = True
            try:
                # Use faster, smaller model (all-MiniLM-L6-v2 is ~80MB, very fast)
                model_name = 'all-MiniLM-L6-v2'  # Faster and smaller than distilbert-base-nli-mean-tokens
                logger.info(f"📥 Loading DistilBERT model: {model_name} (this may take a moment on first run)...")
                self.distilbert_model = SentenceTransformer(model_name)
                _MODEL_CACHE['distilbert_model'] = self.distilbert_model
                logger.info("✅ DistilBERT model loaded successfully")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load DistilBERT: {e}")
                self.distilbert_model = None
        except (ImportError, ValueError, Exception) as e:
            SENTENCE_TRANSFORMERS_AVAILABLE = False
            logger.warning(f"⚠️  sentence-transformers not available: {e}. Using rule-based distractor selection.")
            self.distilbert_model = None
        
        # T5 disabled by default for performance
        T5_AVAILABLE = False
        self.t5_pipeline = None
        
        # Mark models as loaded
        _MODEL_CACHE['models_loaded'] = True
        _MODEL_CACHE['spacy_nlp'] = self.spacy_nlp
        _MODEL_CACHE['distilbert_model'] = self.distilbert_model
        _MODEL_CACHE['t5_pipeline'] = self.t5_pipeline
    
    # ============================================================================
    # IMPROVED FACT EXTRACTION (Clean, Complete Sentences)
    # ============================================================================
    
    def extract_clean_facts(self, text: str) -> List[Dict[str, str]]:
        """
        Extract clean, complete facts from text using regex + spaCy (if available)
        
        Returns facts as complete sentences that can be directly used for questions
        
        Args:
            text: Lesson content text
            
        Returns:
            List of fact dictionaries with complete statements
        """
        facts = []
        # Split by sentences (period, exclamation, question mark)
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Filter criteria for good facts
            if len(sentence) < 25 or len(sentence) > 200:  # Too short or too long
                continue
            
            # Skip questions
            if sentence.strip().endswith('?'):
                continue
            
            # Skip lists/bullet points
            if sentence.startswith(('-', '*', '•', '1.', '2.', '3.')):
                continue
            
            # Block sentences with pronouns (it, this, that, they) - cannot generate good questions
            if re.search(r'\b(it|this|that|they)\s+(?:is|are|was|were|produces?|creates?|occurs?)', sentence.lower()):
                continue
            
            # Try spaCy-enhanced extraction if available
            if self.spacy_nlp:
                fact_from_spacy = self._extract_fact_with_spacy(sentence)
                if fact_from_spacy:
                    # Check if concept is not a pronoun
                    concept = fact_from_spacy.get('concept', '').strip().lower()
                    if concept and concept not in ['it', 'this', 'that', 'they', 'these', 'those']:
                        facts.append(fact_from_spacy)
                        continue  # Skip regex patterns if spaCy found something
            
            # Fallback to regex patterns
            # Look for definition patterns: "X is Y", "X are Y", "X means Y"
            definition_patterns = [
                r'\b([A-Z][A-Za-z\s]{2,40}?)\s+(?:is|are|was|were)\s+([^.!?]{10,100})',
                r'\b([A-Z][A-Za-z\s]{2,40}?)\s+means?\s+([^.!?]{10,100})',
                r'\b([A-Z][A-Za-z\s]{2,40}?)\s+(?:refers?\s+to|defined\s+as)\s+([^.!?]{10,100})',
                # Also match lowercase starts (e.g., "In plants, photosynthesis...")
                r'(?:^|\.\s+)([A-Za-z][A-Za-z\s]{2,40}?)\s+(?:is|are|was|were)\s+([^.!?]{10,100})',
            ]
            
            for pattern in definition_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    subject = match.group(1).strip()
                    predicate = match.group(2).strip()
                    
                    # Clean up predicate (remove trailing commas, etc.)
                    predicate = re.sub(r',\s*$', '', predicate).strip()
                    
                    # Ensure we have a complete answer
                    # Block pronouns and invalid concepts
                    subject_lower = subject.lower().strip()
                    if subject_lower in ['it', 'this', 'that', 'they', 'these', 'those', 'what', 'which']:
                        continue
                    
                    if len(predicate) >= 10 and len(predicate) <= 120:
                        facts.append({
                            'type': 'definition',
                            'concept': subject,
                            'definition': predicate,
                            'statement': sentence,
                            'answer': predicate,  # The correct answer
                            'category': 'definition'  # For category matching
                        })
                        break
            
            # Look for process/action patterns: "X does Y", "X produces Y", "X occurs in Y"
            action_patterns = [
                r'\b([A-Za-z][A-Za-z\s]{2,40}?)\s+(?:occurs?\s+in|happens?\s+in|takes?\s+place\s+in)\s+([^.!?]{10,80})',
                r'\b([A-Za-z][A-Za-z\s]{2,40}?)\s+(?:produces?|creates?|releases?|generates?)\s+([^.!?]{10,80})',
                r'\b([A-Za-z][A-Za-z\s]{2,40}?)\s+(?:uses?|requires?|needs?)\s+([^.!?]{10,80})',
            ]
            
            for pattern in action_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    subject = match.group(1).strip()
                    action_desc = match.group(2).strip()
                    
                    # Block pronouns and invalid concepts
                    subject_lower = subject.lower().strip()
                    if subject_lower in ['it', 'this', 'that', 'they', 'these', 'those', 'what', 'which']:
                        continue
                    
                    # Determine category based on verb
                    statement_lower = sentence.lower()
                    if any(v in statement_lower for v in ['produces', 'creates', 'releases', 'generates']):
                        category = 'output'
                    elif any(v in statement_lower for v in ['uses', 'requires', 'needs']):
                        category = 'input'
                    elif any(v in statement_lower for v in ['occurs', 'happens', 'takes place']):
                        category = 'process'
                    else:
                        category = 'process'
                    
                    if len(action_desc) >= 10 and len(action_desc) <= 100:
                        facts.append({
                            'type': 'process',
                            'concept': subject,
                            'description': action_desc,
                            'statement': sentence,
                            'answer': action_desc,
                            'category': category  # For category matching
                        })
                        break
        
        # Remove duplicates and return
        seen = set()
        unique_facts = []
        for fact in facts:
            key = (fact['concept'].lower(), fact['answer'].lower()[:50])
            if key not in seen:
                seen.add(key)
                unique_facts.append(fact)
        
        return unique_facts[:20]  # Return top 20 unique facts
    
    def _extract_fact_with_spacy(self, sentence: str) -> Optional[Dict]:
        """
        Extract fact from sentence using spaCy dependency parsing
        
        Args:
            sentence: Sentence to analyze
            
        Returns:
            Fact dictionary or None
        """
        if not self.spacy_nlp:
            return None
        
        try:
            doc = self.spacy_nlp(sentence)
            
            # Look for subject-verb-object patterns
            for token in doc:
                # Check for "is/are/means" with subject and complement
                if token.lemma_.lower() in ['be', 'mean', 'refer']:
                    # Find subject
                    subject = None
                    complement = None
                    
                    # Get subject (nsubj dependency)
                    for child in token.children:
                        if child.dep_ == 'nsubj' or child.dep_ == 'nsubjpass':
                            subject = ' '.join([t.text for t in child.subtree])
                            break
                    
                    # Get complement (attr, acomp, xcomp dependencies)
                    for child in token.children:
                        if child.dep_ in ['attr', 'acomp', 'xcomp']:
                            complement = ' '.join([t.text for t in child.subtree])
                            break
                        elif child.dep_ == 'prep':
                            # For "X is in Y" patterns
                            complement = ' '.join([t.text for t in child.subtree])
                    
                    if subject and complement and len(complement) >= 10:
                        subject_lower = subject.strip().lower()
                        # Block pronouns
                        if subject_lower not in ['it', 'this', 'that', 'they', 'these', 'those']:
                            return {
                                'type': 'definition',
                                'concept': subject.strip(),
                                'definition': complement.strip(),
                                'statement': sentence,
                                'answer': complement.strip(),
                                'category': 'definition'
                            }
            
            # Look for verb phrases with objects (process patterns)
            for token in doc:
                if token.pos_ == 'VERB' and token.lemma_.lower() in ['occur', 'happen', 'produce', 'create', 'release', 'use', 'require']:
                    subject = None
                    obj = None
                    
                    # Get subject
                    for child in token.children:
                        if child.dep_ in ['nsubj', 'nsubjpass']:
                            subject = ' '.join([t.text for t in child.subtree])
                            break
                    
                    # Get object/complement
                    for child in token.children:
                        if child.dep_ in ['dobj', 'pobj', 'attr']:
                            obj = ' '.join([t.text for t in child.subtree])
                            break
                    
                    if subject and obj and len(obj) >= 10:
                        subject_lower = subject.strip().lower()
                        # Block pronouns
                        if subject_lower not in ['it', 'this', 'that', 'they', 'these', 'those']:
                            # Determine category
                            statement_lower = sentence.lower()
                            if any(v in statement_lower for v in ['produces', 'creates', 'releases', 'generates']):
                                cat = 'output'
                            elif any(v in statement_lower for v in ['uses', 'requires', 'needs']):
                                cat = 'input'
                            else:
                                cat = 'process'
                            
                            return {
                                'type': 'process',
                                'concept': subject.strip(),
                                'description': obj.strip(),
                                'statement': sentence,
                                'answer': obj.strip(),
                                'category': cat
                            }
            
        except Exception as e:
            logger.debug(f"spaCy extraction failed: {e}")
        
        return None
    
    # ============================================================================
    # IMPROVED DISTRACTOR GENERATION (Complete Answers, Not Fragments)
    # ============================================================================
    
    def generate_quality_distractors(self, correct_answer: str, facts: List[Dict], text: str, category: str = 'definition') -> List[str]:
        """
        Generate quality distractors (complete answer-like options) - CATEGORY-MATCHED
        
        Args:
            correct_answer: The correct answer text
            facts: List of extracted facts
            text: Original lesson text
            category: Category type ('definition', 'process', 'input', 'output') for matching
            
        Returns:
            List of 3 quality distractors from same category
        """
        distractors = []
        
        # Strategy 1: Use answers from other facts in the SAME CATEGORY
        used_concepts = set()
        
        for fact in facts:
            if len(distractors) >= 3:
                break
            
            # Skip if this fact is the correct answer
            if fact.get('answer', '').lower() == correct_answer.lower():
                continue
            
            # ENFORCE CATEGORY MATCHING - only use facts from same category
            fact_category = fact.get('category', 'definition')
            if fact_category != category:
                continue
            
            # Skip if we've used this concept
            concept_key = fact.get('concept', '').lower()
            if concept_key in used_concepts:
                continue
            
            # Use the answer/definition from other facts as distractors
            other_answer = fact.get('answer', '') or fact.get('definition', '') or fact.get('description', '')
            
            if other_answer and len(other_answer) >= 10 and len(other_answer) <= 120:
                # Make it answer-like (complete sentence fragment)
                distractor = other_answer.strip()
                # Remove trailing period if present
                distractor = distractor.rstrip('.')
                
                if distractor.lower() != correct_answer.lower() and distractor not in distractors:
                    distractors.append(distractor)
                    used_concepts.add(concept_key)
        
        # Strategy 2: Generate plausible but incorrect answers based on common misconceptions
        if len(distractors) < 3:
            # Extract the main concept from correct answer (first few words)
            words = correct_answer.split()[:3]
            concept_hint = ' '.join(words).lower() if words else ''
            
            # Common distractor templates (only if we need more)
            generic_distractors = [
                "It depends on various factors",
                "This cannot be determined from the information provided",
                "The opposite process occurs"
            ]
            
            # Try to create context-specific distractors from other sentences
            sentences = re.split(r'[.!?]+', text)
            for sentence in sentences:
                if len(distractors) >= 3:
                    break
                
                sentence = sentence.strip()
                if len(sentence) < 30 or len(sentence) > 150:
                    continue
                
                # Don't use sentences that are too similar to correct answer
                if correct_answer.lower() in sentence.lower():
                    continue
                
                # Use parts of other sentences as distractors
                # Extract a reasonable phrase (10-80 chars)
                words_in_sentence = sentence.split()
                if 5 <= len(words_in_sentence) <= 15:
                    distractor = sentence.rstrip('.')
                    if (distractor.lower() != correct_answer.lower() and 
                        distractor not in distractors and
                        len(distractor) >= 10):
                        distractors.append(distractor)
        
        # Strategy 3: Extract domain-specific nouns/concepts from text for better distractors
        if len(distractors) < 3:
            # Extract nouns from text (domain concepts)
            domain_concepts = self._extract_domain_concepts(text)
            
            # Create domain-aware distractors
            for concept in domain_concepts:
                if len(distractors) >= 3:
                    break
                
                # Skip if concept is already used
                if any(concept.lower() in d.lower() for d in distractors):
                    continue
                
                # Create plausible distractor using domain concept
                distractor_templates = [
                    f"{concept} is the primary mechanism",
                    f"{concept} plays a key role",
                    f"the process involves {concept}"
                ]
                
                for template in distractor_templates:
                    if len(template) >= 10 and len(template) <= 120:
                        if template not in distractors:
                            distractors.append(template)
                            break
        
        # Strategy 4: Fill remaining slots with generic but reasonable options (last resort)
        while len(distractors) < 3:
            generic = random.choice([
                "This process varies depending on conditions",
                "Multiple factors are involved"
            ])
            if generic not in distractors:
                distractors.append(generic)
        
        # Rank distractors using DistilBERT if available (for semantic similarity)
        if self.distilbert_model and len(distractors) >= 3:
            distractors = self._rank_distractors_with_bert(correct_answer, distractors)
        
        return distractors[:3]
    
    def _extract_domain_concepts(self, text: str) -> List[str]:
        """Extract domain-specific concepts/nouns from text"""
        concepts = []
        
        if self.spacy_nlp:
            try:
                doc = self.spacy_nlp(text)
                # Extract noun phrases and important nouns
                for chunk in doc.noun_chunks:
                    if len(chunk.text.split()) <= 3 and len(chunk.text) > 4:
                        concepts.append(chunk.text.strip())
            except:
                pass
        
        # Fallback: simple noun extraction
        if not concepts:
            words = re.findall(r'\b[A-Z][a-z]+\b', text)
            concepts = list(set(words[:15]))
        
        return concepts[:10]
    
    def _rank_distractors_with_bert(self, correct_answer: str, distractors: List[str]) -> List[str]:
        """
        Rank distractors using DistilBERT semantic similarity
        
        Selects distractors that are somewhat similar but distinct (good distractors)
        
        Args:
            correct_answer: Correct answer text
            distractors: List of candidate distractors
            
        Returns:
            Ranked list of top 3 distractors
        """
        if not self.distilbert_model or len(distractors) < 3:
            return distractors
        
        try:
            # Calculate embeddings
            all_texts = [correct_answer] + distractors
            embeddings = self.distilbert_model.encode(all_texts)
            
            correct_emb = embeddings[0]
            dist_embs = embeddings[1:]
            
            # Calculate similarity scores
            similarities = []
            for i, dist_emb in enumerate(dist_embs):
                similarity = np.dot(correct_emb, dist_emb) / (
                    np.linalg.norm(correct_emb) * np.linalg.norm(dist_emb)
                )
                similarities.append((distractors[i], similarity))
            
            # Sort by similarity (we want medium similarity - plausible but distinct)
            similarities.sort(key=lambda x: x[1])
            
            # Select middle range (not too similar, not too different)
            mid_start = len(similarities) // 3
            selected = [d for d, _ in similarities[mid_start:]]
            
            return selected[:3] if len(selected) >= 3 else distractors[:3]
            
        except Exception as e:
            logger.debug(f"BERT ranking failed: {e}")
            return distractors[:3]
    
    def filter_options(self, options: List[str]) -> List[str]:
        """
        Filter out bad options (fragments, duplicates, invalid)
        
        Args:
            options: List of option strings
            
        Returns:
            Filtered list of valid options
        """
        filtered = []
        seen_lower = set()
        
        for option in options:
            option = option.strip()
            
            # Remove if too short (fragment)
            if len(option) < 8:
                continue
            
            # Remove if too long (not a proper answer choice)
            if len(option) > 150:
                continue
            
            # Remove duplicates (case-insensitive)
            option_lower = option.lower()
            if option_lower in seen_lower:
                continue
            
            # Remove if it's just a single word (unless it's a proper noun)
            words = option.split()
            if len(words) == 1 and not option[0].isupper():
                continue
            
            # Remove sentence fragments that start with lowercase
            if option and option[0].islower() and len(words) < 4:
                continue
            
            filtered.append(option)
            seen_lower.add(option_lower)
        
        return filtered
    
    # ============================================================================
    # IMPROVED QUESTION GENERATION
    # ============================================================================
    
    def generate_definition_question(self, fact: Dict, all_facts: List[Dict], text: str) -> Optional[Dict]:
        """
        Generate a definition multiple-choice question from a fact
        
        Args:
            fact: Fact dictionary with concept and definition
            all_facts: All extracted facts (for distractor generation)
            text: Original lesson text
            
        Returns:
            Question dictionary or None if invalid
        """
        concept = fact.get('concept', '').strip()
        definition = fact.get('definition', fact.get('answer', '')).strip()
        
        if not concept or not definition or len(definition) < 10:
            return None
        
        # Clean concept (take first part if too long)
        concept_words = concept.split()
        if len(concept_words) > 5:
            concept = ' '.join(concept_words[:5])
        
        # Generate question
        question_text = f"What is {concept}?"
        
        # Generate quality distractors using all facts
        distractors = self.generate_quality_distractors(definition, all_facts, text)
        
        # Filter options
        options = [definition] + distractors
        options = self.filter_options(options)
        
        if len(options) < 4:
            # Not enough valid options
            return None
        
        # Ensure we have exactly 4 options
        options = options[:4]
        correct_answer = definition
        
        # Shuffle
        random.shuffle(options)
        correct_index = options.index(correct_answer)
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question_text,
            'options': options,
            'correct_index': correct_index
        }
    
    def generate_process_question(self, fact: Dict, all_facts: List[Dict], text: str) -> Optional[Dict]:
        """
        Generate a process/action multiple-choice question from a fact with proper templates
        
        Args:
            fact: Fact dictionary with concept and description
            all_facts: All extracted facts (for distractor generation)
            text: Original lesson text
            
        Returns:
            Question dictionary or None if invalid
        """
        concept = fact.get('concept', '').strip()
        description = fact.get('description', fact.get('answer', '')).strip()
        
        if not concept or not description or len(description) < 10:
            return None
        
        # Block pronouns and invalid concepts
        concept_lower = concept.lower()
        if concept_lower in ['it', 'this', 'that', 'they', 'these', 'those', 'what', 'which']:
            return None
        
        # Clean concept (remove trailing punctuation)
        concept = re.sub(r'[,;:]\s*$', '', concept)
        concept_words = concept.split()
        if len(concept_words) > 5:
            concept = ' '.join(concept_words[:5])
        
        # Generate question using proper templates based on category
        category = fact.get('category', 'process')
        statement_lower = fact.get('statement', '').lower()
        
        if category == 'output' or 'produces' in statement_lower or 'creates' in statement_lower or 'releases' in statement_lower:
            question_text = f"What does {concept} produce?"
        elif category == 'input' or 'uses' in statement_lower or 'requires' in statement_lower or 'needs' in statement_lower:
            question_text = f"What does {concept} use or require?"
        elif category == 'process' or 'occurs' in statement_lower or 'happens' in statement_lower:
            question_text = f"Where does {concept} occur?"
        else:
            # Fallback: use generic but proper question format
            question_text = f"What happens during {concept}?"
        
        # Generate quality distractors (category-matched)
        distractors = self.generate_quality_distractors(description, all_facts, text, category)
        
        # Filter options
        options = [description] + distractors
        options = self.filter_options(options)
        
        if len(options) < 4:
            return None
        
        options = options[:4]
        correct_answer = description
        
        # Shuffle
        random.shuffle(options)
        correct_index = options.index(correct_answer)
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question_text,
            'options': options,
            'correct_index': correct_index
        }
    
    def generate_true_false_question(self, statement: str, is_true: bool = True) -> Optional[Dict]:
        """
        Generate a true/false question from a statement
        
        Args:
            statement: Complete statement from lesson
            is_true: Whether statement is true (default: True)
            
        Returns:
            Question dictionary or None if invalid
        """
        statement = statement.strip()
        
        # Remove trailing period
        if statement.endswith('.'):
            statement = statement[:-1]
        
        # Filter bad statements
        if len(statement) < 20 or len(statement) > 200:
            return None
        
        # Don't use vague statements
        vague_phrases = ['the system', 'the context', 'various factors', 'it depends']
        if any(phrase in statement.lower() for phrase in vague_phrases):
            return None
        
        question_text = f"True or False: {statement}"
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': question_text,
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
    
    def create_safe_false_statement(self, true_statement: str) -> Optional[str]:
        """
        Create a safe false statement by negating specific elements (not hallucinating)
        
        Safe negation strategies:
        - Replace key nouns with wrong but related terms
        - Negate quantifiers (some -> all, always -> never)
        - Replace verbs with opposites where safe
        
        Args:
            true_statement: The true statement to negate
            
        Returns:
            False statement or None if cannot safely negate
        """
        statement = true_statement.strip().rstrip('.')
        
        # Strategy 1: Replace key output/product nouns
        replacements = [
            (r'\boxygen\b', 'nitrogen'),
            (r'\bglucose\b', 'protein'),
            (r'\bwater\b', 'oil'),
            (r'\benergy\b', 'heat'),
            (r'\bcarbon dioxide\b', 'oxygen'),
        ]
        
        for pattern, replacement in replacements:
            if re.search(pattern, statement, re.IGNORECASE):
                false_statement = re.sub(pattern, replacement, statement, flags=re.IGNORECASE)
                if false_statement.lower() != statement.lower():
                    return false_statement
        
        # Strategy 2: Negate quantifiers
        quantifier_replacements = [
            (r'\b(always|all|every)\b', 'never'),
            (r'\b(some|many)\b', 'all'),
            (r'\b(often|usually)\b', 'never'),
        ]
        
        for pattern, replacement in quantifier_replacements:
            if re.search(pattern, statement, re.IGNORECASE):
                false_statement = re.sub(pattern, replacement, statement, flags=re.IGNORECASE)
                if false_statement.lower() != statement.lower():
                    return false_statement
        
        # Strategy 3: Add negation for simple statements
        if len(statement.split()) <= 8:
            # For short statements, add "does not" or "is not"
            if re.search(r'\b(is|are|produces?|creates?|releases?)\b', statement, re.IGNORECASE):
                false_statement = re.sub(r'\b(is|are)\b', 'is not', statement, count=1, flags=re.IGNORECASE)
                false_statement = re.sub(r'\b(produces?|creates?|releases?)\b', r'does not \1', false_statement, count=1, flags=re.IGNORECASE)
                if false_statement.lower() != statement.lower():
                    return false_statement
        
        # If we can't safely negate, return None
        return None
    
    def generate_questions(self, lesson_content: str, num_questions: int = 10) -> List[Dict]:
        """
        Generate quiz questions from lesson content - IMPROVED VERSION
        
        Process:
        1. Extract clean facts (complete sentences) using regex + spaCy
        2. Generate questions from facts using proper templates
        3. Create quality distractors (complete answers, domain-aware)
        4. Filter bad options
        5. Generate True/False with 30-40% false statements (safely negated)
        
        Args:
            lesson_content: The lesson text
            num_questions: Number of questions to generate (5-10, default: 10)
            
        Returns:
            List of quality question dictionaries
        """
        # Enforce min/max limits
        num_questions = max(5, min(10, num_questions))
        
        questions = []
        
        # Step 1: Extract clean facts
        facts = self.extract_clean_facts(lesson_content)
        
        if not facts:
            logger.warning("No facts extracted from lesson content")
            return []
        
        # Step 2: Generate multiple-choice questions (70% of total)
        num_mc = max(3, int(num_questions * 0.7))
        num_tf = num_questions - num_mc
        
        mc_generated = 0
        used_facts = set()
        
        # Generate definition questions
        definition_facts = [f for f in facts if f.get('type') == 'definition']
        for fact in definition_facts:
            if mc_generated >= num_mc:
                break
            
            question = self.generate_definition_question(fact, facts, lesson_content)
            if question:
                questions.append(question)
                mc_generated += 1
                used_facts.add(id(fact))
        
        # Generate process questions
        process_facts = [f for f in facts if f.get('type') == 'process']
        for fact in process_facts:
            if mc_generated >= num_mc:
                break
            
            if id(fact) not in used_facts:
                question = self.generate_process_question(fact, facts, lesson_content)
                if question:
                    questions.append(question)
                    mc_generated += 1
                    used_facts.add(id(fact))
        
        # Step 3: Generate True/False questions (30-40% false statements)
        tf_generated = 0
        false_ratio = 0.35  # 35% false statements
        num_false = max(1, int(num_tf * false_ratio))
        num_true = num_tf - num_false
        
        tf_facts = [f for f in facts if id(f) not in used_facts]
        random.shuffle(tf_facts)
        
        # Generate true statements
        true_generated = 0
        for fact in tf_facts:
            if true_generated >= num_true or tf_generated >= num_tf:
                break
            
            statement = fact.get('statement', '').strip()
            if statement and len(statement) >= 20:
                question = self.generate_true_false_question(statement, is_true=True)
                if question:
                    questions.append(question)
                    tf_generated += 1
                    true_generated += 1
        
        # Generate false statements (safely negated)
        false_generated = 0
        for fact in tf_facts:
            if false_generated >= num_false or tf_generated >= num_tf:
                break
            
            statement = fact.get('statement', '').strip()
            if statement and len(statement) >= 20:
                false_statement = self.create_safe_false_statement(statement)
                if false_statement:
                    question = self.generate_true_false_question(false_statement, is_true=False)
                    if question:
                        questions.append(question)
                        tf_generated += 1
                        false_generated += 1
        
        # Step 4: Limit to requested number (prefer quality over quantity)
        if len(questions) > num_questions:
            # Prioritize multiple choice, then true/false
            mc_questions = [q for q in questions if q['type'] == 'multiple']
            tf_questions = [q for q in questions if q['type'] == 'truefalse']
            
            questions = mc_questions[:num_mc] + tf_questions[:num_tf]
        
        # Shuffle questions
        random.shuffle(questions)
        
        return questions[:num_questions]


def generate_quiz_from_content(content: str, num_questions: int = 10, use_ml: bool = True) -> List[Dict]:
    """
    Main function to generate quiz questions from content
    
    Improved hybrid approach:
    - Clean fact extraction (regex + spaCy dependency parsing)
    - Proper question templates
    - Quality distractors (complete answers, domain-aware, BERT-ranked)
    - Option filtering
    - Safe false statement generation for T/F questions (30-40% false)
    
    Args:
        content: Lesson content text
        num_questions: Number of questions to generate (5-10, default: 10)
        use_ml: Whether to use ML enhancements (default: True)
        
    Returns:
        List of question dictionaries
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(content, num_questions)