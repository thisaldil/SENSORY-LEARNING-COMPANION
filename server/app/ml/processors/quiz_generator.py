"""
Quiz Generator - Hybrid Rule-Based + ML Approach
Generate quiz questions from educational content using:
1. Rule-based NLP (baseline/fallback for explainability)
2. spaCy for improved concept extraction
3. DistilBERT for similarity and distractor ranking
4. T5-small for question rewriting/improvement
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


class QuizGenerator:
    """
    Hybrid Quiz Generator
    
    Combines rule-based NLP (baseline) with lightweight transformer models:
    - Rule-based: Factual correctness, explainability, fallback
    - spaCy: Improved concept extraction via noun phrases
    - DistilBERT: Sentence similarity and distractor ranking
    - T5-small: Question rewriting for better naturalness
    """
    
    def __init__(self, use_ml: bool = True):
        """
        Initialize quiz generator
        
        Args:
            use_ml: Whether to use ML enhancements (spaCy, DistilBERT, T5)
                   If False, uses only rule-based methods
        """
        self.use_ml = use_ml
        
        # Question templates (rule-based)
        self.question_templates = {
            "definition": [
                "What is {concept}?",
                "Define {concept}.",
                "What does {concept} mean?",
            ],
            "relationship": [
                "How does {concept1} relate to {concept2}?",
                "What is the relationship between {concept1} and {concept2}?",
                "How are {concept1} and {concept2} connected?",
            ],
            "cause_effect": [
                "What causes {effect}?",
                "What happens when {cause}?",
                "What is the result of {cause}?",
            ],
            "comparison": [
                "What is the difference between {concept1} and {concept2}?",
                "How does {concept1} differ from {concept2}?",
                "Compare {concept1} and {concept2}.",
            ],
            "fact": [
                "According to the lesson, {statement}?",
                "True or False: {statement}",
                "Is it true that {statement}?",
            ],
        }
        
        # Initialize ML components
        self.spacy_nlp = None
        self.distilbert_model = None
        self.t5_pipeline = None
        
        if self.use_ml:
            self._initialize_ml_components()
    
    def _initialize_ml_components(self):
        """Initialize ML models (spaCy, DistilBERT, T5) with lazy imports"""
        global SPACY_AVAILABLE, SENTENCE_TRANSFORMERS_AVAILABLE, T5_AVAILABLE
        
        # Initialize spaCy
        try:
            import spacy
            SPACY_AVAILABLE = True
            try:
                # Try to load the English model
                self.spacy_nlp = spacy.load("en_core_web_sm")
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
        try:
            from sentence_transformers import SentenceTransformer
            SENTENCE_TRANSFORMERS_AVAILABLE = True
            try:
                self.distilbert_model = SentenceTransformer('distilbert-base-nli-mean-tokens')
                logger.info("✅ DistilBERT model loaded successfully")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load DistilBERT: {e}")
                self.distilbert_model = None
        except (ImportError, ValueError, Exception) as e:
            SENTENCE_TRANSFORMERS_AVAILABLE = False
            logger.warning(f"⚠️  sentence-transformers not available: {e}. Using rule-based distractor selection.")
            self.distilbert_model = None
        
        # Initialize T5-small for question rewriting
        try:
            from transformers import pipeline
            T5_AVAILABLE = True
            try:
                self.t5_pipeline = pipeline(
                    "text2text-generation",
                    model="t5-small",
                    tokenizer="t5-small",
                    max_length=64,
                    do_sample=False
                )
                logger.info("✅ T5-small model loaded successfully")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load T5-small: {e}")
                self.t5_pipeline = None
        except (ImportError, ValueError, Exception) as e:
            T5_AVAILABLE = False
            logger.warning(f"⚠️  T5 not available: {e}. Using template-based questions only.")
            self.t5_pipeline = None
    
    # ============================================================================
    # RULE-BASED METHODS (Baseline/Fallback - DO NOT DELETE)
    # ============================================================================
    
    def extract_key_concepts_rule_based(self, text: str) -> List[str]:
        """
        Rule-based concept extraction (BASELINE/FALLBACK)
        
        Args:
            text: Lesson content text
            
        Returns:
            List of key concepts/terms
        """
        # Convert to lowercase for processing
        text_lower = text.lower()
        
        # Extract capitalized terms (likely important concepts)
        capitalized_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        
        # Extract quoted terms
        quoted_terms = re.findall(r'"([^"]+)"', text)
        
        # Extract terms after "is", "are", "means", "refers to"
        definition_patterns = re.findall(
            r'\b(is|are|means?|refers?\s+to|defined\s+as)\s+([^.,!?]+)',
            text_lower
        )
        
        # Extract key phrases (2-4 words that appear multiple times)
        words = re.findall(r'\b[a-z]+\b', text_lower)
        word_freq = defaultdict(int)
        for word in words:
            if len(word) > 4:  # Skip common short words
                word_freq[word] += 1
        
        # Get frequent terms
        frequent_terms = [term for term, freq in word_freq.items() if freq >= 2]
        
        # Combine and deduplicate
        concepts = set()
        
        # Add capitalized terms
        for term in capitalized_terms:
            if len(term) > 2:
                concepts.add(term)
        
        # Add quoted terms
        concepts.update(quoted_terms)
        
        # Add frequent terms
        concepts.update(frequent_terms[:10])
        
        # Filter out common words
        common_words = {'the', 'this', 'that', 'with', 'from', 'when', 'what', 
                       'where', 'which', 'there', 'their', 'these', 'those'}
        concepts = {c for c in concepts if c.lower() not in common_words}
        
        return list(concepts)[:20]  # Return top 20 concepts
    
    def extract_facts_rule_based(self, text: str) -> List[Dict[str, str]]:
        """
        Rule-based fact extraction (BASELINE/FALLBACK)
        
        Args:
            text: Lesson content text
            
        Returns:
            List of fact dictionaries with statement and type
        """
        facts = []
        sentences = re.split(r'[.!?]+', text)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) < 20:  # Skip very short sentences
                continue
            
            # Look for factual statements
            # Pattern: "X is Y" or "X are Y"
            is_pattern = re.search(r'\b([A-Z][^.!?]+?)\s+(?:is|are|was|were)\s+([^.!?]+)', sentence)
            if is_pattern:
                facts.append({
                    'statement': sentence,
                    'type': 'definition',
                    'subject': is_pattern.group(1).strip(),
                    'predicate': is_pattern.group(2).strip()
                })
            
            # Pattern: "X depends on Y"
            depends_pattern = re.search(r'\b([^.!?]+?)\s+depends?\s+on\s+([^.!?]+)', sentence, re.IGNORECASE)
            if depends_pattern:
                facts.append({
                    'statement': sentence,
                    'type': 'relationship',
                    'subject': depends_pattern.group(1).strip(),
                    'object': depends_pattern.group(2).strip()
                })
            
            # Pattern: "X causes Y" or "X results in Y"
            cause_pattern = re.search(
                r'\b([^.!?]+?)\s+(?:causes?|results?\s+in|leads?\s+to)\s+([^.!?]+)',
                sentence, re.IGNORECASE
            )
            if cause_pattern:
                facts.append({
                    'statement': sentence,
                    'type': 'cause_effect',
                    'cause': cause_pattern.group(1).strip(),
                    'effect': cause_pattern.group(2).strip()
                })
        
        return facts[:15]  # Return top 15 facts
    
    def create_distractors_rule_based(self, correct_answer: str, concepts: List[str], text: str) -> List[str]:
        """
        Rule-based distractor generation (BASELINE/FALLBACK)
        
        Args:
            correct_answer: The correct answer
            concepts: List of concepts from the text
            text: Original text for context
            
        Returns:
            List of distractor options
        """
        distractors = []
        
        # Use other concepts as distractors
        for concept in concepts:
            if concept.lower() != correct_answer.lower() and len(distractors) < 3:
                # Check if concept is somewhat related (appears near correct answer in text)
                if concept.lower() in text.lower():
                    distractors.append(concept)
        
        # Add generic distractors if needed
        generic_distractors = [
            "It varies depending on the situation",
            "There is no relationship",
            "The opposite is true",
            "It cannot be determined from the information given"
        ]
        
        while len(distractors) < 3:
            distractor = random.choice(generic_distractors)
            if distractor not in distractors:
                distractors.append(distractor)
        
        return distractors[:3]
    
    # ============================================================================
    # ML-ENHANCED METHODS (spaCy, DistilBERT, T5)
    # ============================================================================
    
    def extract_key_concepts_spacy(self, text: str) -> List[str]:
        """
        Extract key concepts using spaCy noun phrase extraction
        
        Args:
            text: Lesson content text
            
        Returns:
            List of key concepts (noun phrases)
        """
        if not self.spacy_nlp:
            # Fallback to rule-based
            return self.extract_key_concepts_rule_based(text)
        
        try:
            doc = self.spacy_nlp(text)
            concepts = []
            
            # Extract noun phrases
            for chunk in doc.noun_chunks:
                # Filter out common words and short phrases
                if len(chunk.text) > 3 and chunk.text.lower() not in ['the', 'this', 'that', 'these', 'those']:
                    concepts.append(chunk.text.strip())
            
            # Extract named entities
            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT', 'PRODUCT', 'WORK_OF_ART']:
                    concepts.append(ent.text.strip())
            
            # Extract important nouns (excluding common words)
            for token in doc:
                if (token.pos_ == "NOUN" and 
                    token.text.lower() not in ['the', 'this', 'that', 'thing', 'way', 'time'] and
                    len(token.text) > 4):
                    concepts.append(token.text.strip())
            
            # Deduplicate and limit
            concepts = list(set(concepts))[:25]
            
            return concepts if concepts else self.extract_key_concepts_rule_based(text)
            
        except Exception as e:
            logger.warning(f"spaCy extraction failed: {e}. Falling back to rule-based.")
            return self.extract_key_concepts_rule_based(text)
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """
        Hybrid concept extraction: spaCy + rule-based fallback
        
        Args:
            text: Lesson content text
            
        Returns:
            List of key concepts
        """
        if self.use_ml and self.spacy_nlp:
            # Combine spaCy and rule-based for best results
            spacy_concepts = self.extract_key_concepts_spacy(text)
            rule_concepts = self.extract_key_concepts_rule_based(text)
            
            # Merge and deduplicate (prefer spaCy concepts)
            all_concepts = list(set(spacy_concepts + rule_concepts))
            return all_concepts[:25]
        else:
            return self.extract_key_concepts_rule_based(text)
    
    def rank_distractors_with_distilbert(self, correct_answer: str, candidate_distractors: List[str]) -> List[str]:
        """
        Rank distractors using DistilBERT sentence similarity
        
        Args:
            correct_answer: The correct answer
            candidate_distractors: List of candidate distractor options
            
        Returns:
            Top 3 ranked distractors (most plausible but distinct from correct answer)
        """
        if not self.distilbert_model or not candidate_distractors:
            return candidate_distractors[:3]
        
        try:
            # Calculate embeddings
            all_texts = [correct_answer] + candidate_distractors
            embeddings = self.distilbert_model.encode(all_texts)
            
            correct_embedding = embeddings[0]
            distractor_embeddings = embeddings[1:]
            
            # Calculate similarity scores (cosine similarity)
            similarities = []
            for i, dist_emb in enumerate(distractor_embeddings):
                # Cosine similarity
                similarity = np.dot(correct_embedding, dist_emb) / (
                    np.linalg.norm(correct_embedding) * np.linalg.norm(dist_emb)
                )
                similarities.append((candidate_distractors[i], similarity))
            
            # Sort by similarity (we want distractors that are somewhat similar
            # but not too similar - good distractors are in the middle range)
            similarities.sort(key=lambda x: x[1])
            
            # Select distractors: avoid too similar (cheating) and too different (obvious wrong)
            # Take middle range for plausible distractors
            mid_start = len(similarities) // 3
            mid_end = 2 * len(similarities) // 3
            
            selected = []
            for distractor, sim in similarities[mid_start:mid_end]:
                if len(selected) < 3:
                    selected.append(distractor)
            
            # Fill remaining slots if needed
            while len(selected) < 3 and len(selected) < len(candidate_distractors):
                for distractor, _ in similarities:
                    if distractor not in selected:
                        selected.append(distractor)
                        break
            
            return selected[:3]
            
        except Exception as e:
            logger.warning(f"DistilBERT ranking failed: {e}. Using original order.")
            return candidate_distractors[:3]
    
    def create_distractors(self, correct_answer: str, concepts: List[str], text: str) -> List[str]:
        """
        Hybrid distractor generation: rule-based candidates + DistilBERT ranking
        
        Args:
            correct_answer: The correct answer
            concepts: List of concepts from the text
            text: Original text for context
            
        Returns:
            List of top 3 ranked distractor options
        """
        # Get rule-based candidates
        candidate_distractors = self.create_distractors_rule_based(correct_answer, concepts, text)
        
        # Enhance with DistilBERT ranking if available
        if self.use_ml and self.distilbert_model:
            ranked_distractors = self.rank_distractors_with_distilbert(correct_answer, candidate_distractors)
            return ranked_distractors
        
        return candidate_distractors
    
    def rewrite_question_with_t5(self, question_text: str, context: str = "") -> str:
        """
        Rewrite/improve question using T5-small
        
        Args:
            question_text: Original question text
            context: Optional context (answer or relevant text)
            
        Returns:
            Improved question text
        """
        if not self.t5_pipeline:
            return question_text
        
        try:
            # Use T5 to rewrite question for better naturalness
            # Format: "rewrite question: {original question}"
            input_text = f"rewrite question: {question_text}"
            
            result = self.t5_pipeline(input_text, max_length=64, num_return_sequences=1)
            rewritten = result[0]['generated_text'].strip()
            
            # Clean up the output
            rewritten = rewritten.replace("question:", "").strip()
            
            # Only use if it's reasonable (not empty, reasonable length)
            if rewritten and len(rewritten) > 5 and len(rewritten) < 200:
                return rewritten
            else:
                return question_text
                
        except Exception as e:
            logger.warning(f"T5 rewriting failed: {e}. Using original question.")
            return question_text
    
    def improve_question(self, question_text: str, question_type: str = "definition") -> str:
        """
        Improve question text using T5 (if available) or return original
        
        Args:
            question_text: Original question text
            question_type: Type of question (definition, relationship, etc.)
            
        Returns:
            Improved question text
        """
        if self.use_ml and self.t5_pipeline:
            # Only rewrite definition and relationship questions for now
            # (they benefit most from rewriting)
            if question_type in ["definition", "relationship"]:
                return self.rewrite_question_with_t5(question_text)
        
        return question_text
    
    # ============================================================================
    # QUESTION GENERATION METHODS
    # ============================================================================
    
    def extract_facts(self, text: str) -> List[Dict[str, str]]:
        """
        Extract facts using rule-based method (hybrid enhancement can be added later)
        
        Args:
            text: Lesson content text
            
        Returns:
            List of fact dictionaries
        """
        return self.extract_facts_rule_based(text)
    
    def generate_multiple_choice_question(
        self, 
        question_text: str, 
        correct_answer: str, 
        distractors: List[str],
        question_type: str = "definition"
    ) -> Dict:
        """
        Generate a multiple choice question
        
        Args:
            question_text: The question text
            correct_answer: The correct answer
            distractors: List of incorrect answer options
            question_type: Type of question (for potential improvement)
            
        Returns:
            Question dictionary
        """
        # Improve question text with T5 if available
        improved_question = self.improve_question(question_text, question_type)
        
        # Ensure we have exactly 3 distractors
        while len(distractors) < 3:
            distractors.append("None of the above")
        
        # Combine correct answer and distractors
        options = [correct_answer] + distractors[:3]
        
        # Shuffle options
        random.shuffle(options)
        
        # Find correct index
        correct_index = options.index(correct_answer)
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': improved_question,
            'options': options,
            'correct_index': correct_index
        }
    
    def generate_true_false_question(
        self, 
        statement: str, 
        is_true: bool
    ) -> Dict:
        """
        Generate a true/false question
        
        Args:
            statement: The statement to evaluate
            is_true: Whether the statement is true
            
        Returns:
            Question dictionary
        """
        # Clean up statement
        statement = statement.strip()
        if statement.endswith('.'):
            statement = statement[:-1]
        
        question_text = f"True or False: {statement}"
        
        # Optionally improve with T5 (but keep it simple for True/False)
        # improved_question = self.improve_question(question_text, "fact") if self.use_ml else question_text
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': question_text,
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
    
    def generate_questions(self, lesson_content: str, num_questions: int = 10) -> List[Dict]:
        """
        Generate quiz questions from lesson content using hybrid approach
        
        Architecture:
        1. Rule-based extraction (baseline) + spaCy enhancement
        2. Rule-based question generation + T5 improvement (optional)
        3. Rule-based distractor generation + DistilBERT ranking
        
        Args:
            lesson_content: The lesson text
            num_questions: Number of questions to generate (default: 10)
            
        Returns:
            List of question dictionaries
        """
        questions = []
        
        # Extract concepts (hybrid: spaCy + rule-based)
        concepts = self.extract_key_concepts(lesson_content)
        
        # Extract facts (rule-based)
        facts = self.extract_facts(lesson_content)
        
        # Split content into sentences for context
        sentences = [s.strip() for s in re.split(r'[.!?]+', lesson_content) if len(s.strip()) > 20]
        
        # Generate multiple choice questions (60% of total)
        num_mc = int(num_questions * 0.6)
        num_tf = num_questions - num_mc
        
        # Generate multiple choice questions
        mc_generated = 0
        for fact in facts:
            if mc_generated >= num_mc:
                break
            
            if fact['type'] == 'definition' and 'subject' in fact:
                # Question about definition
                concept = fact['subject']
                definition = fact['predicate']
                
                question_text = f"What is {concept}?"
                distractors = self.create_distractors(definition, concepts, lesson_content)
                
                question = self.generate_multiple_choice_question(
                    question_text, definition, distractors, "definition"
                )
                questions.append(question)
                mc_generated += 1
            
            elif fact['type'] == 'relationship' and 'subject' in fact:
                # Question about relationship
                concept1 = fact['subject']
                concept2 = fact.get('object', '')
                
                if concept2:
                    question_text = f"How does {concept1} relate to {concept2}?"
                    # Extract relationship description
                    relationship_desc = fact['statement']
                    distractors = self.create_distractors(
                        relationship_desc, concepts, lesson_content
                    )
                    
                    question = self.generate_multiple_choice_question(
                        question_text, relationship_desc, distractors, "relationship"
                    )
                    questions.append(question)
                    mc_generated += 1
        
        # Generate more MC questions from concepts if needed
        while mc_generated < num_mc and concepts:
            concept = random.choice(concepts)
            concepts.remove(concept)
            
            # Find sentences mentioning this concept
            relevant_sentences = [s for s in sentences if concept.lower() in s.lower()]
            if relevant_sentences:
                sentence = random.choice(relevant_sentences)
                
                # Create question about the concept
                question_text = f"According to the lesson, what is true about {concept}?"
                
                # Extract key information from sentence (use shorter answer)
                answer = sentence[:100] if len(sentence) > 100 else sentence
                distractors = self.create_distractors(answer, concepts, lesson_content)
                
                question = self.generate_multiple_choice_question(
                    question_text, answer, distractors, "fact"
                )
                questions.append(question)
                mc_generated += 1
        
        # Generate True/False questions
        tf_generated = 0
        for fact in facts:
            if tf_generated >= num_tf:
                break
            
            statement = fact['statement']
            # Create true statement
            question = self.generate_true_false_question(statement, True)
            questions.append(question)
            tf_generated += 1
        
        # Generate false statements for variety
        while tf_generated < num_tf and concepts:
            concept = random.choice(concepts)
            if concept in concepts:  # Check if still in list
                concepts.remove(concept)
            
            # Create a false statement
            false_statements = [
                f"{concept} has no effect on the system.",
                f"{concept} is not important in this context.",
                f"{concept} works independently of other factors.",
            ]
            
            false_statement = random.choice(false_statements)
            question = self.generate_true_false_question(false_statement, False)
            questions.append(question)
            tf_generated += 1
        
        # Ensure we have exactly num_questions
        if len(questions) > num_questions:
            questions = questions[:num_questions]
        elif len(questions) < num_questions:
            # Fill remaining with generic questions
            remaining = num_questions - len(questions)
            for i in range(remaining):
                if concepts:
                    concept = random.choice(concepts)
                    question_text = f"What is a key concept related to {concept}?"
                    answer = "Refer to the lesson content"
                    distractors = self.create_distractors(answer, concepts, lesson_content)
                    question = self.generate_multiple_choice_question(
                        question_text, answer, distractors, "fact"
                    )
                    questions.append(question)
        
        # Shuffle questions
        random.shuffle(questions)
        
        return questions


def generate_quiz_from_content(content: str, num_questions: int = 10, use_ml: bool = True) -> List[Dict]:
    """
    Main function to generate quiz questions from content
    
    Hybrid approach:
    - Rule-based NLP (baseline/fallback for explainability)
    - spaCy for improved concept extraction
    - DistilBERT for distractor ranking
    - T5-small for question rewriting (optional)
    
    Args:
        content: Lesson content text
        num_questions: Number of questions to generate
        use_ml: Whether to use ML enhancements (default: True)
        
    Returns:
        List of question dictionaries
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(content, num_questions)