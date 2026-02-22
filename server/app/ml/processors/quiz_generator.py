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
            "general": [
                "What does the lesson say about {concept}?",
                "According to the text, what is a key fact about {concept}?",
            ]
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
        
        # Length checks - RELAXED
        if len(subject_lower) < 2 or len(subject_lower) > 50:
            return False
        
        # Filter invalid starters - REDUCED LIST
        invalid_starters = [
            'the ', 'a ', 'an ', 'this ', 'that ',
            'in ', 'on ', 'at ', 'by ', 'for ', 'of ', 'to ', 'from '
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
    # CONCEPT EXTRACTION - IMPROVED
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
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT', 'PRODUCT', 'LOC', 'FAC']:
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
            
            # Extract single important nouns
            for token in doc:
                if token.pos_ == 'NOUN' and len(token.text) > 3:
                    text_clean = token.text.capitalize()
                    if self.is_valid_subject(text_clean):
                        if text_clean not in concepts:
                            concepts[text_clean] = {
                                'text': text_clean,
                                'frequency': 0,
                                'importance': 1
                            }
                        concepts[text_clean]['frequency'] += 1
            
            # Sort by score
            concept_list = sorted(
                concepts.values(),
                key=lambda x: (x['frequency'] * x['importance']),
                reverse=True
            )
            
            return concept_list[:20]
            
        except Exception:
            return self.extract_concepts_rule_based(text)
    
    def extract_concepts_rule_based(self, text: str) -> List[Dict]:
        """Rule-based concept extraction - IMPROVED"""
        concepts = {}
        
        # Capitalized terms (proper nouns)
        cap_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b'
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
        
        # Important common nouns (planets, gravity, etc.)
        common_nouns = re.findall(r'\b([a-z]{4,})\b', text)
        noun_counts = defaultdict(int)
        for noun in common_nouns:
            if noun not in self.stopwords:
                noun_counts[noun] += 1
        
        # Add frequently mentioned nouns
        for noun, count in noun_counts.items():
            if count >= 2:  # Mentioned at least twice
                clean = noun.capitalize()
                if self.is_valid_subject(clean):
                    if clean not in concepts:
                        concepts[clean] = {'text': clean, 'frequency': 0, 'importance': 2}
                    concepts[clean]['frequency'] += count
        
        # Sort by score
        concept_list = sorted(
            concepts.values(),
            key=lambda x: (x['frequency'] * x['importance']),
            reverse=True
        )
        
        return concept_list[:20]
    
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
            # Pattern 1: "Subject is/are predicate"
            pattern1 = r'^([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-z]+){0,4})\s+(is|are)\s+(.+?)(?:\.\s*$|$)'
            match = re.search(pattern1, sentence)
            
            if match:
                subject = match.group(1).strip()
                predicate = match.group(3).strip()
                
                # Clean subject
                subject = self.clean_subject(subject)
                
                # Validate subject
                if not self.is_valid_subject(subject):
                    continue
                
                # Validate predicate - RELAXED
                if (len(predicate.split()) >= 4 and
                    len(predicate) >= 20 and
                    len(predicate) < 250):
                    
                    facts.append({
                        'type': 'definition',
                        'subject': subject,
                        'predicate': predicate,
                        'sentence': sentence,
                        'score': len(predicate.split()) + 5  # Boost definition facts
                    })
            
            # Pattern 2: Extract facts about specific concepts
            # "X has/have/includes/contains Y"
            pattern2 = r'([A-Z][a-zA-Z\s]{2,35}?)\s+(has|have|includes|contains|consists of)\s+(.+?)(?:\.|$)'
            match = re.search(pattern2, sentence)
            
            if match:
                subject = self.clean_subject(match.group(1).strip())
                predicate = match.group(3).strip()
                
                if (self.is_valid_subject(subject) and
                    len(predicate.split()) >= 4 and
                    len(predicate) >= 20):
                    
                    facts.append({
                        'type': 'property',
                        'subject': subject,
                        'predicate': predicate,
                        'sentence': sentence,
                        'score': len(predicate.split()) + 3
                    })
        
        # Sort by quality
        facts.sort(key=lambda x: x['score'], reverse=True)
        
        return facts
    
    # ============================================================================
    # DISTRACTOR GENERATION - IMPROVED
    # ============================================================================
    
    def create_distractors(
        self,
        correct_answer: str,
        all_facts: List[Dict],
        sentences: List[str],
        concept: str = ""
    ) -> List[str]:
        """Create plausible distractors from other facts"""
        distractors = []
        used = {correct_answer.lower()}
        
        # Use predicates from other facts (prioritize different subjects)
        for fact in all_facts:
            if len(distractors) >= 7:
                break
            
            # Skip facts about the same subject to make better distractors
            if 'subject' in fact and concept and fact['subject'].lower() == concept.lower():
                continue
            
            if 'predicate' in fact:
                pred = fact['predicate'].strip()
                
                if (pred.lower() not in used and
                    len(pred.split()) >= 4 and
                    len(pred) >= 20 and
                    len(pred) < 250):
                    
                    distractors.append(pred)
                    used.add(pred.lower())
        
        # Extract additional meaningful phrases from sentences
        for sentence in sentences:
            if len(distractors) >= 7:
                break
            
            # Look for clauses
            clause_patterns = [
                r'because\s+(.+?)(?:\.|$)',
                r'since\s+(.+?)(?:\.|$)',
                r',\s+which\s+(.+?)(?:\.|$)',
                r'as\s+(.+?)(?:\.|$)',
            ]
            
            for pattern in clause_patterns:
                match = re.search(pattern, sentence, re.IGNORECASE)
                if match:
                    clause = match.group(1).strip()
                    if (clause.lower() not in used and
                        len(clause.split()) >= 4 and
                        len(clause) >= 20 and
                        len(clause) < 180):
                        distractors.append(clause)
                        used.add(clause.lower())
                        break
        
        # Generic fallback distractors - MORE OPTIONS
        generic = [
            "a temporary phenomenon that only occurs under specific conditions in rare circumstances",
            "an outdated concept that has been replaced by more modern understanding and research",
            "a collection of independent elements that do not interact with each other significantly",
            "primarily a theoretical construct with limited practical application in real situations",
            "something that varies dramatically depending on external factors and environmental conditions",
            "a recently discovered feature that scientists are still studying and trying to understand fully",
            "an ancient theory that has been disproven by modern scientific methods and observations",
            "a complex process that requires specialized equipment and training to observe directly",
            "a rare occurrence that happens only once every several decades under unique circumstances",
            "an abstract concept that exists only in theoretical models without physical manifestation",
        ]
        
        for g in generic:
            if len(distractors) >= 7:
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
    # QUESTION GENERATION - IMPROVED
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
        
        # Filter distractors - RELAXED
        unique = []
        for d in distractors:
            if (d.lower() != correct.lower() and
                d not in unique and
                len(d.split()) >= 3 and
                len(d) >= 15):
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
            len(statement) < 250 and
            statement[0].isupper()):
            return result
        
        return None
    
    def validate_question(self, q: Dict) -> bool:
        """Strict validation"""
        if not all(k in q for k in ['question', 'options', 'correct_index']):
            return False
        
        question = q['question']
        options = q['options']
        
        # Question checks - RELAXED
        if (len(question) < 15 or
            len(question) > 250 or
            not question.endswith('?') or
            not question[0].isupper()):
            return False
        
        # Invalid patterns
        invalid = [
            r'\b(?:and|or|but|of|in|on|at)\s*\?$',
            r'\s{2,}',
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
            if len(opt.split()) < 3 or len(opt) < 12:
                return False
        
        return True
    
    def generate_questions(
        self,
        content: str,
        num_questions: int = 10
    ) -> List[Dict]:
        """
        Generate high-quality quiz questions - IMPROVED ALGORITHM
        """
        # Ensure minimum 7 questions
        if num_questions < 7:
            num_questions = 7
        
        # Extract
        concepts = self.extract_concepts(content)
        facts = self.extract_facts(content)
        sentences = self.split_sentences(content)
        
        logger.info(f"Extracted {len(concepts)} concepts and {len(facts)} facts")
        
        if not facts:
            logger.warning("No quality facts extracted")
            return []
        
        questions = []
        used_questions = set()  # Track question text to avoid duplicates
        
        # Target distribution: 60% MC, 40% TF
        target_mc = max(4, int(num_questions * 0.6))
        target_tf = num_questions - target_mc
        
        mc_count = 0
        tf_count = 0
        
        # PHASE 1: Generate from facts (primary source)
        for fact in facts:
            if mc_count >= target_mc and tf_count >= target_tf:
                break
            
            subject = fact['subject']
            
            # Multiple choice from this fact
            if mc_count < target_mc:
                predicate = fact['predicate']
                
                # Try different question templates
                templates = self.question_templates.get(fact['type'], self.question_templates['definition'])
                
                for template in templates:
                    q_text = template.format(concept=subject)
                    
                    if q_text.lower() in used_questions:
                        continue
                    
                    # Get distractors
                    distractors = self.create_distractors(predicate, facts, sentences, subject)
                    
                    if self.use_ml and self.distilbert_model:
                        distractors = self.rank_distractors(predicate, distractors)
                    
                    question = self.create_multiple_choice(q_text, predicate, distractors)
                    
                    if question:
                        questions.append(question)
                        used_questions.add(q_text.lower())
                        mc_count += 1
                        break
            
            # True/False from this fact
            if tf_count < target_tf:
                sentence = fact['sentence']
                
                if sentence.lower() not in used_questions:
                    q = self.create_true_false(sentence, True)
                    
                    if q:
                        questions.append(q)
                        used_questions.add(sentence.lower())
                        tf_count += 1
        
        # PHASE 2: Generate from standalone sentences if we don't have enough
        if len(questions) < num_questions:
            for sentence in sentences:
                if len(questions) >= num_questions:
                    break
                
                if sentence.lower() in used_questions:
                    continue
                
                # Create T/F question
                q = self.create_true_false(sentence, True)
                
                if q:
                    questions.append(q)
                    used_questions.add(sentence.lower())
        
        # PHASE 3: If still not enough, try extracting more concepts
        if len(questions) < 7:
            logger.warning(f"Only generated {len(questions)} questions, attempting to extract more")
            
            # Try to create questions about each major concept
            for concept in concepts[:15]:
                if len(questions) >= num_questions:
                    break
                
                concept_text = concept['text']
                
                # Find sentences mentioning this concept
                for sentence in sentences:
                    if concept_text.lower() in sentence.lower():
                        if sentence.lower() not in used_questions:
                            q = self.create_true_false(sentence, True)
                            if q:
                                questions.append(q)
                                used_questions.add(sentence.lower())
                                break
        
        # Shuffle
        random.shuffle(questions)
        
        # Ensure we return between 7 and num_questions
        final_count = max(7, min(len(questions), num_questions))
        
        logger.info(f"Generated {len(questions)} questions, returning {final_count}")
        
        return questions[:final_count]


def generate_quiz_from_content(
    content: str,
    num_questions: int = 10,
    use_ml: bool = True
) -> List[Dict]:
    """
    Generate quiz questions from lesson content
    
    Args:
        content: Lesson text
        num_questions: Number of questions (default: 10, minimum: 7)
        use_ml: Use ML enhancements (default: True)
    
    Returns:
        List of validated question dictionaries (minimum 7, maximum num_questions)
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(content, num_questions)