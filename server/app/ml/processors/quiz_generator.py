"""
Enhanced Quiz Generator - Production Quality
Generates well-formed, grammatically correct quiz questions
"""
import re
import random
import uuid
import logging
from typing import List, Dict, Optional, Set
from collections import defaultdict

# ML Libraries - Lazy imports
SPACY_AVAILABLE = False
SENTENCE_TRANSFORMERS_AVAILABLE = False
T5_AVAILABLE = False

import numpy as np

logger = logging.getLogger(__name__)


class QuizGenerator:
    """
    Production-ready Quiz Generator with strict quality controls
    """
    
    def __init__(self, use_ml: bool = True):
        self.use_ml = use_ml
        
        # Simple, reliable question templates
        self.question_templates = {
            "definition": [
                "What is {concept}?",
                "Which of the following best describes {concept}?",
                "According to the lesson, what is {concept}?",
            ],
            "property": [
                "Which statement about {concept} is correct?",
                "What is true about {concept} according to the lesson?",
                "Which best describes a characteristic of {concept}?",
            ],
        }
        
        # Words to filter
        self.stopwords = {
            'the', 'this', 'that', 'with', 'from', 'when', 'what', 
            'where', 'which', 'there', 'their', 'these', 'those',
            'have', 'has', 'had', 'will', 'would', 'could', 'should',
            'more', 'most', 'very', 'also', 'just', 'only', 'about',
            'some', 'such', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again',
            'each', 'other', 'being', 'been', 'both', 'same'
        }
        
        self.spacy_nlp = None
        self.distilbert_model = None
        self.t5_pipeline = None
        
        if self.use_ml:
            self._initialize_ml_components()
    
    def _initialize_ml_components(self):
        """Initialize ML models"""
        global SPACY_AVAILABLE, SENTENCE_TRANSFORMERS_AVAILABLE, T5_AVAILABLE
        
        try:
            import spacy
            SPACY_AVAILABLE = True
            try:
                self.spacy_nlp = spacy.load("en_core_web_sm")
                logger.info("✅ spaCy loaded")
            except OSError:
                self.spacy_nlp = None
        except Exception:
            self.spacy_nlp = None
        
        try:
            from sentence_transformers import SentenceTransformer
            SENTENCE_TRANSFORMERS_AVAILABLE = True
            try:
                self.distilbert_model = SentenceTransformer('distilbert-base-nli-mean-tokens')
                logger.info("✅ DistilBERT loaded")
            except Exception:
                self.distilbert_model = None
        except Exception:
            self.distilbert_model = None
        
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
                logger.info("✅ T5 loaded")
            except Exception:
                self.t5_pipeline = None
        except Exception:
            self.t5_pipeline = None
    
    # ============================================================================
    # TEXT PROCESSING
    # ============================================================================
    
    def clean_text(self, text: str) -> str:
        """Clean text"""
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\s+([.,!?])', r'\1', text)
        return text.strip()
    
    def split_sentences(self, text: str) -> List[str]:
        """Split into quality sentences"""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        clean = []
        for sent in sentences:
            sent = self.clean_text(sent)
            if (len(sent) >= 40 and 
                len(sent.split()) >= 7 and
                sent[0].isupper() and
                sent[-1] in '.!?'):
                clean.append(sent)
        
        return clean
    
    def is_valid_subject(self, subject: str) -> bool:
        """Check if subject is valid for question generation"""
        subject_lower = subject.lower().strip()
        
        # Length checks
        if len(subject_lower) < 3 or len(subject_lower) > 40:
            return False
        
        # Filter invalid starters
        invalid_starters = [
            'the ', 'a ', 'an ', 'this ', 'that ', 'these ', 'those ',
            'in ', 'on ', 'at ', 'by ', 'for ', 'of ', 'to ', 'from ',
            'with ', 'about ', 'into ', 'through ', 'during ', 'before ',
            'after ', 'above ', 'below ', 'under ', 'between '
        ]
        
        for starter in invalid_starters:
            if subject_lower.startswith(starter):
                return False
        
        # Must not end with conjunctions or prepositions
        invalid_enders = [' and', ' or', ' but', ' of', ' in', ' on', ' at']
        for ender in invalid_enders:
            if subject_lower.endswith(ender):
                return False
        
        # Must contain at least one letter
        if not re.search(r'[a-zA-Z]', subject):
            return False
        
        # Must not be all stopwords
        words = subject_lower.split()
        if all(word in self.stopwords for word in words):
            return False
        
        return True
    
    def clean_subject(self, subject: str) -> str:
        """Clean and standardize a subject"""
        # Remove leading articles
        subject = re.sub(r'^(?:the|a|an)\s+', '', subject, flags=re.IGNORECASE)
        
        # Remove trailing punctuation except for valid cases
        subject = subject.rstrip('.,;:')
        
        # Capitalize first letter
        if subject:
            subject = subject[0].upper() + subject[1:]
        
        return subject.strip()
    
    # ============================================================================
    # CONCEPT EXTRACTION
    # ============================================================================
    
    def extract_concepts_spacy(self, text: str) -> List[Dict]:
        """Extract concepts using spaCy"""
        if not self.spacy_nlp:
            return self.extract_concepts_rule_based(text)
        
        try:
            doc = self.spacy_nlp(text)
            concepts = {}
            
            # Extract named entities (highest priority)
            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT', 'PRODUCT', 'LOC']:
                    text_clean = self.clean_subject(ent.text)
                    if self.is_valid_subject(text_clean):
                        if text_clean not in concepts:
                            concepts[text_clean] = {
                                'text': text_clean,
                                'frequency': 0,
                                'importance': 5
                            }
                        concepts[text_clean]['frequency'] += 2
            
            # Extract noun phrases
            for chunk in doc.noun_chunks:
                text_clean = self.clean_subject(chunk.text)
                if self.is_valid_subject(text_clean):
                    if text_clean not in concepts:
                        concepts[text_clean] = {
                            'text': text_clean,
                            'frequency': 0,
                            'importance': 2
                        }
                    concepts[text_clean]['frequency'] += 1
            
            # Sort by score
            concept_list = sorted(
                concepts.values(),
                key=lambda x: (x['frequency'] * x['importance']),
                reverse=True
            )
            
            return concept_list[:12]
            
        except Exception:
            return self.extract_concepts_rule_based(text)
    
    def extract_concepts_rule_based(self, text: str) -> List[Dict]:
        """Rule-based concept extraction"""
        concepts = {}
        
        # Capitalized terms (proper nouns)
        cap_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b'
        cap_terms = re.findall(cap_pattern, text)
        
        for term in cap_terms:
            clean = self.clean_subject(term)
            if self.is_valid_subject(clean):
                if clean not in concepts:
                    concepts[clean] = {'text': clean, 'frequency': 0, 'importance': 3}
                concepts[clean]['frequency'] += 1
        
        # Quoted terms
        quoted = re.findall(r'["\']([^"\']{3,40})["\']', text)
        for term in quoted:
            clean = self.clean_subject(term)
            if self.is_valid_subject(clean):
                if clean not in concepts:
                    concepts[clean] = {'text': clean, 'frequency': 0, 'importance': 5}
                concepts[clean]['frequency'] += 2
        
        # Subjects being defined
        def_pattern = r'\b([A-Z][a-zA-Z\s]{2,35}?)\s+(?:is|are)\s+(?:a|an|the)\s+'
        subjects = re.findall(def_pattern, text)
        
        for subj in subjects:
            clean = self.clean_subject(subj)
            if self.is_valid_subject(clean):
                if clean not in concepts:
                    concepts[clean] = {'text': clean, 'frequency': 0, 'importance': 4}
                concepts[clean]['frequency'] += 3
        
        # Sort by score
        concept_list = sorted(
            concepts.values(),
            key=lambda x: (x['frequency'] * x['importance']),
            reverse=True
        )
        
        return concept_list[:12]
    
    def extract_concepts(self, text: str) -> List[Dict]:
        """Hybrid extraction"""
        if self.use_ml and self.spacy_nlp:
            return self.extract_concepts_spacy(text)
        return self.extract_concepts_rule_based(text)
    
    # ============================================================================
    # FACT EXTRACTION - IMPROVED
    # ============================================================================
    
    def extract_facts(self, text: str) -> List[Dict]:
        """
        Extract well-formed facts with complete subjects and predicates
        """
        facts = []
        sentences = self.split_sentences(text)
        
        for sentence in sentences:
            # Pattern: "Subject is/are predicate"
            # More restrictive - subject must be a proper noun phrase
            pattern = r'^([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-z]+){0,3})\s+(is|are)\s+(.+?)(?:\.\s*$|$)'
            match = re.search(pattern, sentence)
            
            if match:
                subject = match.group(1).strip()
                predicate = match.group(3).strip()
                
                # Clean subject
                subject = self.clean_subject(subject)
                
                # Validate subject
                if not self.is_valid_subject(subject):
                    continue
                
                # Validate predicate - must be complete and meaningful
                if (len(predicate.split()) >= 5 and
                    len(predicate) >= 30 and
                    len(predicate) < 200 and
                    predicate[0].islower() and  # Should start with lowercase after "is/are"
                    not predicate.startswith(tuple(self.stopwords))):
                    
                    # Additional check - predicate should have substance
                    predicate_words = [w for w in predicate.split() if w.lower() not in self.stopwords]
                    if len(predicate_words) >= 3:
                        facts.append({
                            'type': 'definition',
                            'subject': subject,
                            'predicate': predicate,
                            'sentence': sentence,
                            'score': len(predicate.split())
                        })
        
        # Sort by quality
        facts.sort(key=lambda x: x['score'], reverse=True)
        
        return facts
    
    # ============================================================================
    # DISTRACTOR GENERATION
    # ============================================================================
    
    def create_distractors(
        self,
        correct_answer: str,
        all_facts: List[Dict],
        sentences: List[str]
    ) -> List[str]:
        """Create plausible distractors from other facts"""
        distractors = []
        used = {correct_answer.lower()}
        
        # Use predicates from other facts
        for fact in all_facts:
            if len(distractors) >= 5:
                break
            
            if 'predicate' in fact:
                pred = fact['predicate'].strip()
                
                if (pred.lower() not in used and
                    len(pred.split()) >= 5 and
                    len(pred) >= 30 and
                    len(pred) < 200):
                    
                    distractors.append(pred)
                    used.add(pred.lower())
        
        # Extract additional meaningful phrases from sentences
        for sentence in sentences:
            if len(distractors) >= 5:
                break
            
            # Look for clauses after "because", "since", "as"
            clause_patterns = [
                r'because\s+(.+?)(?:\.|$)',
                r'since\s+(.+?)(?:\.|$)',
                r',\s+which\s+(.+?)(?:\.|$)',
            ]
            
            for pattern in clause_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    clause = match.group(1).strip()
                    if (clause.lower() not in used and
                        len(clause.split()) >= 5 and
                        len(clause) >= 30 and
                        len(clause) < 150):
                        distractors.append(clause)
                        used.add(clause.lower())
                        break
        
        # Generic fallback distractors
        generic = [
            "a temporary phenomenon that only occurs under specific conditions in rare circumstances",
            "an outdated concept that has been replaced by more modern understanding and research",
            "a collection of independent elements that do not interact with each other significantly",
            "primarily a theoretical construct with limited practical application in real situations",
            "something that varies dramatically depending on external factors and environmental conditions",
        ]
        
        for g in generic:
            if len(distractors) >= 5:
                break
            if g.lower() not in used:
                distractors.append(g)
                used.add(g.lower())
        
        return distractors
    
    def rank_distractors(self, correct: str, candidates: List[str]) -> List[str]:
        """Rank distractors by semantic similarity"""
        if not self.distilbert_model or len(candidates) < 3:
            return candidates[:3]
        
        try:
            all_texts = [correct] + candidates
            embeddings = self.distilbert_model.encode(all_texts)
            
            correct_emb = embeddings[0]
            
            scores = []
            for i, emb in enumerate(embeddings[1:]):
                sim = np.dot(correct_emb, emb) / (
                    np.linalg.norm(correct_emb) * np.linalg.norm(emb)
                )
                # Want medium similarity (around 0.4-0.6)
                ideal_dist = abs(sim - 0.5)
                scores.append((candidates[i], ideal_dist))
            
            scores.sort(key=lambda x: x[1])
            return [s[0] for s in scores[:3]]
            
        except Exception:
            return candidates[:3]
    
    # ============================================================================
    # QUESTION GENERATION
    # ============================================================================
    
    def create_multiple_choice(
        self,
        question: str,
        correct: str,
        distractors: List[str]
    ) -> Optional[Dict]:
        """Generate MC question with validation"""
        
        question = self.clean_text(question)
        correct = self.clean_text(correct)
        distractors = [self.clean_text(d) for d in distractors if d]
        
        # Ensure question ends with ?
        if not question.endswith('?'):
            question += '?'
        
        # Filter distractors
        unique = []
        for d in distractors:
            if (d.lower() != correct.lower() and
                d not in unique and
                len(d.split()) >= 4 and
                len(d) >= 20):
                unique.append(d)
        
        if len(unique) < 3:
            return None
        
        # Create options
        options = [correct] + unique[:3]
        random.shuffle(options)
        
        result = {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question,
            'options': options,
            'correct_index': options.index(correct)
        }
        
        return result if self.validate_question(result) else None
    
    def create_true_false(self, statement: str, is_true: bool) -> Optional[Dict]:
        """Generate T/F question"""
        statement = self.clean_text(statement)
        
        if statement.endswith('.'):
            statement = statement[:-1]
        
        question = f"True or False: {statement}?"
        
        result = {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': question,
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
        
        if (len(statement.split()) >= 7 and
            len(statement) >= 35 and
            len(statement) < 200 and
            statement[0].isupper()):
            return result
        
        return None
    
    def validate_question(self, q: Dict) -> bool:
        """Strict validation"""
        if not all(k in q for k in ['question', 'options', 'correct_index']):
            return False
        
        question = q['question']
        options = q['options']
        
        # Question checks
        if (len(question) < 20 or
            len(question) > 200 or
            not question.endswith('?') or
            not question[0].isupper()):
            return False
        
        # Invalid patterns
        invalid = [
            r'\b(?:and|or|but|of|in|on|at)\s*\?$',  # Ends with conjunction/preposition
            r'\s{2,}',  # Multiple spaces
        ]
        
        for pattern in invalid:
            if re.search(pattern, question):
                return False
        
        # Options checks
        if len(options) != 4:
            return False
        
        if len(set(o.lower() for o in options)) != 4:
            return False
        
        for opt in options:
            if len(opt.split()) < 3 or len(opt) < 15:
                return False
        
        return True
    
    def generate_questions(
        self,
        content: str,
        num_questions: int = 10
    ) -> List[Dict]:
        """
        Generate high-quality quiz questions
        """
        # Extract
        concepts = self.extract_concepts(content)
        facts = self.extract_facts(content)
        sentences = self.split_sentences(content)
        
        if not facts:
            logger.warning("No quality facts extracted")
            return []
        
        questions = []
        used_subjects = set()
        
        target_mc = int(num_questions * 0.6)
        target_tf = num_questions - target_mc
        
        mc_count = 0
        tf_count = 0
        
        # Generate from facts
        for fact in facts:
            if mc_count >= target_mc and tf_count >= target_tf:
                break
            
            subject = fact['subject']
            
            # Avoid duplicates
            if subject.lower() in used_subjects:
                continue
            
            # Multiple choice
            if mc_count < target_mc:
                predicate = fact['predicate']
                
                # Simple, reliable question
                q_text = f"What is {subject}?"
                
                # Get distractors
                distractors = self.create_distractors(predicate, facts, sentences)
                
                if self.use_ml and self.distilbert_model:
                    distractors = self.rank_distractors(predicate, distractors)
                
                question = self.create_multiple_choice(q_text, predicate, distractors)
                
                if question:
                    questions.append(question)
                    used_subjects.add(subject.lower())
                    mc_count += 1
            
            # True/False
            if tf_count < target_tf:
                sentence = fact['sentence']
                q = self.create_true_false(sentence, True)
                
                if q:
                    questions.append(q)
                    tf_count += 1
        
        # Shuffle
        random.shuffle(questions)
        
        return questions[:num_questions]


def generate_quiz_from_content(
    content: str,
    num_questions: int = 10,
    use_ml: bool = True
) -> List[Dict]:
    """
    Generate quiz questions from lesson content
    
    Args:
        content: Lesson text
        num_questions: Number of questions (default: 10)
        use_ml: Use ML enhancements (default: True)
    
    Returns:
        List of validated question dictionaries
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(content, num_questions)