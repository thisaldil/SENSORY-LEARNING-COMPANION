"""
Improved Quiz Generator - Hybrid Rule-Based + ML Approach
Generates high-quality quiz questions with better answer extraction and validation
"""
import re
import random
import uuid
import logging
from typing import List, Dict, Tuple, Optional, Set
from collections import defaultdict, Counter

# ML Libraries - Lazy imports
SPACY_AVAILABLE = False
SENTENCE_TRANSFORMERS_AVAILABLE = False
T5_AVAILABLE = False

import numpy as np

logger = logging.getLogger(__name__)


class QuizGenerator:
    """
    Improved Hybrid Quiz Generator with quality validation
    """
    
    def __init__(self, use_ml: bool = True):
        self.use_ml = use_ml
        
        # Question templates with better structure
        self.question_templates = {
            "definition": [
                "What is {concept}?",
                "Which best describes {concept}?",
                "What does the term '{concept}' refer to?",
            ],
            "property": [
                "What is a key characteristic of {concept}?",
                "Which statement about {concept} is correct?",
                "What is true about {concept}?",
            ],
            "relationship": [
                "How does {concept1} affect {concept2}?",
                "What is the relationship between {concept1} and {concept2}?",
            ],
            "cause_effect": [
                "What causes {effect}?",
                "What is the effect of {cause}?",
            ],
        }
        
        # Common words to filter out
        self.stopwords = {
            'the', 'this', 'that', 'with', 'from', 'when', 'what', 
            'where', 'which', 'there', 'their', 'these', 'those',
            'have', 'has', 'had', 'will', 'would', 'could', 'should',
            'more', 'most', 'very', 'also', 'just', 'only', 'about'
        }
        
        self.spacy_nlp = None
        self.distilbert_model = None
        self.t5_pipeline = None
        
        if self.use_ml:
            self._initialize_ml_components()
    
    def _initialize_ml_components(self):
        """Initialize ML models with lazy imports"""
        global SPACY_AVAILABLE, SENTENCE_TRANSFORMERS_AVAILABLE, T5_AVAILABLE
        
        # Initialize spaCy
        try:
            import spacy
            SPACY_AVAILABLE = True
            try:
                self.spacy_nlp = spacy.load("en_core_web_sm")
                logger.info("✅ spaCy model loaded")
            except OSError:
                logger.warning("⚠️  spaCy model not found. Install: python -m spacy download en_core_web_sm")
                self.spacy_nlp = None
        except Exception as e:
            logger.warning(f"⚠️  spaCy not available: {e}")
            self.spacy_nlp = None
        
        # Initialize DistilBERT
        try:
            from sentence_transformers import SentenceTransformer
            SENTENCE_TRANSFORMERS_AVAILABLE = True
            try:
                self.distilbert_model = SentenceTransformer('distilbert-base-nli-mean-tokens')
                logger.info("✅ DistilBERT model loaded")
            except Exception as e:
                logger.warning(f"⚠️  DistilBERT failed: {e}")
                self.distilbert_model = None
        except Exception as e:
            logger.warning(f"⚠️  sentence-transformers not available: {e}")
            self.distilbert_model = None
        
        # Initialize T5
        try:
            from transformers import pipeline
            T5_AVAILABLE = True
            try:
                self.t5_pipeline = pipeline(
                    "text2text-generation",
                    model="t5-small",
                    max_length=64,
                    do_sample=False
                )
                logger.info("✅ T5-small model loaded")
            except Exception as e:
                logger.warning(f"⚠️  T5 failed: {e}")
                self.t5_pipeline = None
        except Exception as e:
            logger.warning(f"⚠️  T5 not available: {e}")
            self.t5_pipeline = None
    
    # ============================================================================
    # IMPROVED TEXT PROCESSING
    # ============================================================================
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Fix common issues
        text = re.sub(r'\s+([.,!?])', r'\1', text)
        return text.strip()
    
    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into clean sentences"""
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Clean and filter sentences
        clean_sentences = []
        for sent in sentences:
            sent = self.clean_text(sent)
            # Keep sentences that are substantial and complete
            if (len(sent) >= 30 and 
                len(sent.split()) >= 5 and
                sent[0].isupper() and
                sent[-1] in '.!?'):
                clean_sentences.append(sent)
        
        return clean_sentences
    
    def extract_complete_answer(self, sentence: str, concept: str) -> Optional[str]:
        """
        Extract a complete, meaningful answer from a sentence
        
        Returns the part of the sentence that explains the concept
        """
        sentence = sentence.strip()
        
        # Pattern 1: "X is Y" or "X are Y" - extract Y
        is_pattern = re.search(
            rf'\b{re.escape(concept)}\s+(?:is|are|was|were)\s+(.+?)(?:\.|,|$)',
            sentence,
            re.IGNORECASE
        )
        if is_pattern:
            answer = is_pattern.group(1).strip()
            # Make sure answer is substantial
            if len(answer.split()) >= 3:
                return answer
        
        # Pattern 2: Full sentence containing the concept
        if concept.lower() in sentence.lower():
            # Return the complete sentence as context
            return sentence
        
        return None
    
    # ============================================================================
    # IMPROVED CONCEPT EXTRACTION
    # ============================================================================
    
    def extract_key_concepts_spacy(self, text: str) -> List[Dict[str, any]]:
        """
        Extract key concepts with metadata using spaCy
        
        Returns: List of dicts with 'text', 'type', 'frequency'
        """
        if not self.spacy_nlp:
            return self.extract_key_concepts_rule_based(text)
        
        try:
            doc = self.spacy_nlp(text)
            concept_freq = defaultdict(int)
            concept_info = {}
            
            # Extract noun phrases with context
            for chunk in doc.noun_chunks:
                # Filter quality
                text_clean = chunk.text.strip()
                if (len(text_clean) > 3 and 
                    text_clean.lower() not in self.stopwords and
                    not text_clean.lower().startswith(('the ', 'a ', 'an '))):
                    
                    concept_freq[text_clean] += 1
                    if text_clean not in concept_info:
                        concept_info[text_clean] = {
                            'text': text_clean,
                            'type': 'noun_phrase',
                            'frequency': 0
                        }
            
            # Extract named entities
            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT', 'PRODUCT']:
                    text_clean = ent.text.strip()
                    concept_freq[text_clean] += 1
                    if text_clean not in concept_info:
                        concept_info[text_clean] = {
                            'text': text_clean,
                            'type': 'named_entity',
                            'frequency': 0
                        }
            
            # Update frequencies
            for concept in concept_info:
                concept_info[concept]['frequency'] = concept_freq[concept]
            
            # Sort by frequency and quality
            concepts = sorted(
                concept_info.values(),
                key=lambda x: (x['frequency'], len(x['text'])),
                reverse=True
            )
            
            return concepts[:20]
            
        except Exception as e:
            logger.warning(f"spaCy extraction failed: {e}")
            return self.extract_key_concepts_rule_based(text)
    
    def extract_key_concepts_rule_based(self, text: str) -> List[Dict[str, any]]:
        """Improved rule-based concept extraction"""
        concepts = []
        concept_freq = defaultdict(int)
        
        # Extract capitalized terms
        cap_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        for term in cap_terms:
            if len(term) > 3 and term.lower() not in self.stopwords:
                concept_freq[term] += 1
        
        # Extract quoted terms
        quoted = re.findall(r'"([^"]+)"', text)
        quoted += re.findall(r"'([^']+)'", text)
        for term in quoted:
            if len(term) > 3:
                concept_freq[term] += 2  # Higher weight for quoted terms
        
        # Extract defined terms (terms being defined)
        definitions = re.findall(
            r'\b([A-Z][a-z]+(?:\s+[a-z]+)?)\s+(?:is|are|means?|refers?\s+to)',
            text
        )
        for term in definitions:
            concept_freq[term] += 3  # Highest weight for defined terms
        
        # Convert to list with metadata
        for concept, freq in sorted(concept_freq.items(), key=lambda x: x[1], reverse=True):
            concepts.append({
                'text': concept,
                'type': 'rule_based',
                'frequency': freq
            })
        
        return concepts[:20]
    
    def extract_key_concepts(self, text: str) -> List[Dict[str, any]]:
        """Hybrid concept extraction"""
        if self.use_ml and self.spacy_nlp:
            return self.extract_key_concepts_spacy(text)
        return self.extract_key_concepts_rule_based(text)
    
    # ============================================================================
    # IMPROVED FACT EXTRACTION
    # ============================================================================
    
    def extract_facts_improved(self, text: str) -> List[Dict[str, any]]:
        """
        Extract facts with complete context and validation
        """
        facts = []
        sentences = self.split_into_sentences(text)
        
        for sentence in sentences:
            # Skip if too short
            if len(sentence.split()) < 6:
                continue
            
            # Pattern 1: Definition - "X is/are Y"
            def_match = re.search(
                r'\b([A-Z][a-zA-Z\s]+?)\s+(is|are)\s+(.+?)(?:\.|,\s+(?:and|but|which))',
                sentence
            )
            if def_match:
                subject = def_match.group(1).strip()
                predicate = def_match.group(3).strip()
                
                # Validate quality
                if len(predicate.split()) >= 3 and len(predicate) < 150:
                    facts.append({
                        'type': 'definition',
                        'subject': subject,
                        'predicate': predicate,
                        'full_sentence': sentence,
                        'quality_score': len(predicate.split())
                    })
            
            # Pattern 2: Cause/Effect
            cause_patterns = [
                r'(.+?)\s+(?:causes?|leads?\s+to|results?\s+in)\s+(.+)',
                r'(?:because|since|due to)\s+(.+?),\s+(.+)',
            ]
            
            for pattern in cause_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    cause = match.group(1).strip()
                    effect = match.group(2).strip()
                    
                    if len(cause.split()) >= 3 and len(effect.split()) >= 3:
                        facts.append({
                            'type': 'cause_effect',
                            'cause': cause,
                            'effect': effect,
                            'full_sentence': sentence,
                            'quality_score': len(sentence.split())
                        })
                    break
            
            # Pattern 3: Property/Characteristic
            property_patterns = [
                r'([A-Z][a-zA-Z\s]+?)\s+(?:has|have|contains?|includes?)\s+(.+)',
                r'([A-Z][a-zA-Z\s]+?)\s+(?:can|could|may|might)\s+(.+)',
            ]
            
            for pattern in property_patterns:
                match = re.search(pattern, sentence)
                if match:
                    subject = match.group(1).strip()
                    property_desc = match.group(2).strip()
                    
                    if len(property_desc.split()) >= 3:
                        facts.append({
                            'type': 'property',
                            'subject': subject,
                            'property': property_desc,
                            'full_sentence': sentence,
                            'quality_score': len(property_desc.split())
                        })
                    break
        
        # Sort by quality score
        facts.sort(key=lambda x: x['quality_score'], reverse=True)
        
        return facts[:20]
    
    # ============================================================================
    # IMPROVED DISTRACTOR GENERATION
    # ============================================================================
    
    def create_smart_distractors(
        self, 
        correct_answer: str, 
        concepts: List[Dict], 
        all_sentences: List[str],
        question_type: str
    ) -> List[str]:
        """
        Create plausible distractors that are wrong but seem reasonable
        """
        distractors = []
        used_texts = {correct_answer.lower()}
        
        # Strategy 1: Use similar sentences/phrases from the text
        for sentence in all_sentences:
            if len(distractors) >= 3:
                break
            
            # Skip if too similar to correct answer
            if sentence.lower() == correct_answer.lower():
                continue
            
            # Extract meaningful phrases
            phrases = re.findall(r'[^.!?,]+[.!?]?', sentence)
            for phrase in phrases:
                phrase = phrase.strip(' .,!?')
                
                # Check if it's a good distractor
                if (len(phrase.split()) >= 3 and 
                    len(phrase.split()) <= 20 and
                    phrase.lower() not in used_texts and
                    phrase.lower() != correct_answer.lower()):
                    
                    distractors.append(phrase)
                    used_texts.add(phrase.lower())
                    
                    if len(distractors) >= 3:
                        break
        
        # Strategy 2: Use other concept definitions
        for concept_info in concepts:
            if len(distractors) >= 3:
                break
            
            concept = concept_info['text']
            if concept.lower() not in used_texts:
                distractors.append(concept)
                used_texts.add(concept.lower())
        
        # Strategy 3: Create plausible wrong answers based on type
        generic_by_type = {
            'definition': [
                "A type of measurement used in scientific calculations",
                "A process that occurs naturally without external influence",
                "A fundamental principle that applies in all situations",
            ],
            'property': [
                "It has no measurable effect on the system",
                "It varies depending on environmental conditions only",
                "It remains constant regardless of other factors",
            ],
            'cause_effect': [
                "There is no direct relationship between these factors",
                "The opposite effect occurs under normal conditions",
                "Multiple factors combine to produce unpredictable results",
            ],
        }
        
        generic_distractors = generic_by_type.get(question_type, [
            "This cannot be determined from the given information",
            "All of the above factors contribute equally",
            "None of these factors are relevant",
        ])
        
        # Add generic distractors if needed
        for distractor in generic_distractors:
            if len(distractors) >= 3:
                break
            if distractor.lower() not in used_texts:
                distractors.append(distractor)
                used_texts.add(distractor.lower())
        
        return distractors[:3]
    
    def rank_distractors_with_distilbert(
        self, 
        correct_answer: str, 
        candidate_distractors: List[str]
    ) -> List[str]:
        """Rank distractors using DistilBERT similarity"""
        if not self.distilbert_model or len(candidate_distractors) < 3:
            return candidate_distractors[:3]
        
        try:
            all_texts = [correct_answer] + candidate_distractors
            embeddings = self.distilbert_model.encode(all_texts)
            
            correct_emb = embeddings[0]
            
            similarities = []
            for i, dist_emb in enumerate(embeddings[1:]):
                similarity = np.dot(correct_emb, dist_emb) / (
                    np.linalg.norm(correct_emb) * np.linalg.norm(dist_emb)
                )
                similarities.append((candidate_distractors[i], similarity))
            
            # Sort by similarity - we want medium similarity (plausible but wrong)
            similarities.sort(key=lambda x: abs(x[1] - 0.5))  # Closest to 0.5 similarity
            
            return [d[0] for d in similarities[:3]]
            
        except Exception as e:
            logger.warning(f"DistilBERT ranking failed: {e}")
            return candidate_distractors[:3]
    
    # ============================================================================
    # QUESTION VALIDATION
    # ============================================================================
    
    def validate_question(self, question_dict: Dict) -> bool:
        """
        Validate question quality before adding to quiz
        """
        # Check required fields
        if not all(key in question_dict for key in ['question', 'options', 'correct_index']):
            return False
        
        question_text = question_dict['question']
        options = question_dict['options']
        correct_index = question_dict['correct_index']
        
        # Validate question text
        if (len(question_text) < 10 or 
            len(question_text) > 200 or
            not question_text.strip() or
            question_text.lower().startswith('not_') or
            question_text.endswith('?') == False):
            return False
        
        # Validate options
        if len(options) != 4:
            return False
        
        # Check all options are unique and substantial
        if len(set(opt.lower() for opt in options)) != 4:
            return False
        
        for opt in options:
            if len(opt.strip()) < 3 or len(opt) > 200:
                return False
        
        # Validate correct index
        if correct_index < 0 or correct_index >= len(options):
            return False
        
        # Check correct answer is substantial
        correct_answer = options[correct_index]
        if len(correct_answer.split()) < 2:
            return False
        
        return True
    
    # ============================================================================
    # QUESTION GENERATION
    # ============================================================================
    
    def generate_multiple_choice_question(
        self,
        question_text: str,
        correct_answer: str,
        distractors: List[str],
        question_type: str = "definition"
    ) -> Optional[Dict]:
        """Generate validated multiple choice question"""
        
        # Clean inputs
        question_text = self.clean_text(question_text)
        correct_answer = self.clean_text(correct_answer)
        distractors = [self.clean_text(d) for d in distractors]
        
        # Ensure we have exactly 3 unique distractors
        unique_distractors = []
        for d in distractors:
            if d.lower() != correct_answer.lower() and d not in unique_distractors:
                unique_distractors.append(d)
        
        while len(unique_distractors) < 3:
            unique_distractors.append("This information is not provided in the lesson")
        
        # Combine and shuffle
        options = [correct_answer] + unique_distractors[:3]
        random.shuffle(options)
        correct_index = options.index(correct_answer)
        
        question_dict = {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question_text,
            'options': options,
            'correct_index': correct_index
        }
        
        # Validate before returning
        if self.validate_question(question_dict):
            return question_dict
        
        return None
    
    def generate_true_false_question(
        self,
        statement: str,
        is_true: bool
    ) -> Optional[Dict]:
        """Generate validated true/false question"""
        
        statement = self.clean_text(statement)
        
        # Remove trailing period for cleaner format
        if statement.endswith('.'):
            statement = statement[:-1]
        
        question_text = f"True or False: {statement}?"
        
        question_dict = {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': question_text,
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
        
        # Validate
        if (len(statement.split()) >= 5 and 
            len(statement) < 200 and
            statement[0].isupper()):
            return question_dict
        
        return None
    
    def generate_questions(
        self, 
        lesson_content: str, 
        num_questions: int = 10
    ) -> List[Dict]:
        """
        Generate high-quality quiz questions with validation
        """
        questions = []
        
        # Extract components
        concepts = self.extract_key_concepts(lesson_content)
        facts = self.extract_facts_improved(lesson_content)
        sentences = self.split_into_sentences(lesson_content)
        
        # Target distribution
        target_mc = int(num_questions * 0.6)
        target_tf = num_questions - target_mc
        
        mc_count = 0
        tf_count = 0
        
        # Generate from facts
        for fact in facts:
            if mc_count >= target_mc and tf_count >= target_tf:
                break
            
            # Multiple choice from definitions
            if fact['type'] == 'definition' and mc_count < target_mc:
                subject = fact['subject']
                predicate = fact['predicate']
                
                question_text = f"What is {subject}?"
                
                distractors = self.create_smart_distractors(
                    predicate, concepts, sentences, 'definition'
                )
                
                if self.use_ml and self.distilbert_model:
                    distractors = self.rank_distractors_with_distilbert(predicate, distractors)
                
                question = self.generate_multiple_choice_question(
                    question_text, predicate, distractors, 'definition'
                )
                
                if question:
                    questions.append(question)
                    mc_count += 1
            
            # True/False from full sentences
            elif fact['type'] in ['definition', 'property'] and tf_count < target_tf:
                full_sentence = fact['full_sentence']
                
                question = self.generate_true_false_question(full_sentence, True)
                
                if question:
                    questions.append(question)
                    tf_count += 1
        
        # Fill remaining slots with concept-based questions
        used_concepts = set()
        
        while mc_count < target_mc and concepts:
            concept_info = concepts.pop(0)
            concept = concept_info['text']
            
            if concept in used_concepts:
                continue
            
            used_concepts.add(concept)
            
            # Find sentences mentioning this concept
            relevant_sents = [s for s in sentences if concept.lower() in s.lower()]
            
            if relevant_sents:
                sent = relevant_sents[0]
                answer = self.extract_complete_answer(sent, concept)
                
                if answer and len(answer.split()) >= 4:
                    question_text = f"According to the lesson, which statement about {concept} is correct?"
                    
                    distractors = self.create_smart_distractors(
                        answer, concepts, sentences, 'property'
                    )
                    
                    if self.use_ml and self.distilbert_model:
                        distractors = self.rank_distractors_with_distilbert(answer, distractors)
                    
                    question = self.generate_multiple_choice_question(
                        question_text, answer, distractors, 'property'
                    )
                    
                    if question:
                        questions.append(question)
                        mc_count += 1
        
        # Shuffle final questions
        random.shuffle(questions)
        
        return questions[:num_questions]


def generate_quiz_from_content(
    content: str, 
    num_questions: int = 10, 
    use_ml: bool = True
) -> List[Dict]:
    """
    Generate high-quality quiz questions from lesson content
    
    Args:
        content: Lesson content text
        num_questions: Number of questions to generate
        use_ml: Whether to use ML enhancements
        
    Returns:
        List of validated question dictionaries
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(content, num_questions)