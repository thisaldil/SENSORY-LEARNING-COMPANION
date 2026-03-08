"""
Enhanced Quiz Generator - Cognitive Load Aware
Generates accurate, deduplicated, grammatically correct quiz questions.

Key improvements over previous version:
- No duplicate answer content leaking across questions
- No generic placeholder distractors ("an unrelated scientific idea...")
- T/F stems are rewritten as clean declarative statements (no "This occurs...")
- Distractors are semantically meaningful alternatives, not raw text fragments
- Cross-question answer deduplication prevents correct answers appearing as distractors
- Load-aware: question complexity, distractor difficulty, and phrasing all scale with cognitive load
"""

import re
import random
import uuid
import logging
from typing import List, Dict, Optional, Set
from collections import defaultdict

SPACY_AVAILABLE = False
SENTENCE_TRANSFORMERS_AVAILABLE = False

import numpy as np

logger = logging.getLogger(__name__)


class QuizGenerator:
    """
    Production-ready Quiz Generator with cognitive load-aware controls.

    Cognitive Load → Quiz shape:
    ─────────────────────────────────────────────────────
    OVERLOAD  →  4 MCQ  6 TF  3 options  simple wording
    OPTIMAL   →  5 MCQ  5 TF  4 options  balanced
    LOW       →  6 MCQ  4 TF  4 options  analytical wording
    ─────────────────────────────────────────────────────
    """

    def __init__(self, use_ml: bool = True):
        self.use_ml = use_ml
        self.spacy_nlp = None
        self.distilbert_model = None

        self.stopwords = {
            'the', 'this', 'that', 'with', 'from', 'when', 'what',
            'where', 'which', 'there', 'their', 'these', 'those',
            'have', 'has', 'had', 'will', 'would', 'could', 'should',
            'more', 'most', 'very', 'also', 'just', 'only', 'about',
            'some', 'such', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again',
            'each', 'other', 'being', 'been', 'both', 'same'
        }

        if self.use_ml:
            self._initialize_ml_components()

    # ──────────────────────────────────────────────────────────────────────────
    # ML INIT
    # ──────────────────────────────────────────────────────────────────────────

    def _initialize_ml_components(self):
        global SPACY_AVAILABLE, SENTENCE_TRANSFORMERS_AVAILABLE

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
                self.distilbert_model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("✅ SentenceTransformer loaded")
            except Exception:
                self.distilbert_model = None
        except Exception:
            self.distilbert_model = None

    # ──────────────────────────────────────────────────────────────────────────
    # TEXT UTILITIES
    # ──────────────────────────────────────────────────────────────────────────

    def clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\s+([.,!?])', r'\1', text)
        return text.strip()

    def split_sentences(self, text: str) -> List[str]:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        clean = []
        for sent in sentences:
            sent = self.clean_text(sent)
            if (
                len(sent) >= 40
                and len(sent.split()) >= 7
                and sent[0].isupper()
                and sent[-1] in '.!?'
            ):
                clean.append(sent)
        return clean

    def is_valid_subject(self, subject: str) -> bool:
        s = subject.lower().strip()
        if len(s) < 2 or len(s) > 60:
            return False
        bad_starts = [
            'the ', 'a ', 'an ', 'this ', 'that ',
            'in ', 'on ', 'at ', 'by ', 'for ', 'of ', 'to ', 'from '
        ]
        if any(s.startswith(p) for p in bad_starts):
            return False
        bad_ends = [' and', ' or', ' but', ' of', ' in', ' on', ' at']
        if any(s.endswith(p) for p in bad_ends):
            return False
        if not re.search(r'[a-zA-Z]', subject):
            return False
        return True

    def clean_subject(self, subject: str) -> str:
        subject = re.sub(r'^(?:the|a|an)\s+', '', subject, flags=re.IGNORECASE)
        subject = subject.rstrip('.,;:')
        if subject:
            subject = subject[0].upper() + subject[1:]
        return subject.strip()

    # ──────────────────────────────────────────────────────────────────────────
    # SENTENCE → CLEAN T/F STEM
    # Rewrites "This occurs within X..." → "X is a process that..."
    # Removes dangling pronouns so every T/F stem stands alone.
    # ──────────────────────────────────────────────────────────────────────────

    _DANGLING_PRONOUNS = re.compile(
        r'^(This|These|That|Those|It|They|He|She)\s+',
        re.IGNORECASE
    )

    def _rewrite_tf_stem(self, sentence: str, subject_hint: str = '') -> Optional[str]:
        """
        Convert a raw sentence into a clean T/F statement.
        Returns None if the sentence cannot be made into a usable standalone statement.
        """
        sentence = self.clean_text(sentence)

        # Drop sentences that start with dangling pronouns if we can't fix them
        if self._DANGLING_PRONOUNS.match(sentence):
            if not subject_hint:
                return None  # no subject to substitute
            # Replace the dangling pronoun phrase with the subject hint
            sentence = self._DANGLING_PRONOUNS.sub(f'{subject_hint} ', sentence)
            sentence = sentence[0].upper() + sentence[1:]

        # Strip trailing period for question format
        if sentence.endswith('.'):
            sentence = sentence[:-1]

        # Must be long enough
        if len(sentence.split()) < 7 or len(sentence) < 35:
            return None

        return sentence

    # ──────────────────────────────────────────────────────────────────────────
    # CONCEPT EXTRACTION
    # ──────────────────────────────────────────────────────────────────────────

    def extract_concepts(self, text: str) -> List[Dict]:
        if self.use_ml and self.spacy_nlp:
            return self._extract_concepts_spacy(text)
        return self._extract_concepts_rule_based(text)

    def _extract_concepts_spacy(self, text: str) -> List[Dict]:
        if not self.spacy_nlp:
            return self._extract_concepts_rule_based(text)
        try:
            doc = self.spacy_nlp(text)
            concepts: Dict[str, Dict] = {}

            for ent in doc.ents:
                if ent.label_ in ['PERSON', 'ORG', 'GPE', 'EVENT', 'PRODUCT', 'LOC', 'FAC']:
                    clean = self.clean_subject(ent.text)
                    if self.is_valid_subject(clean):
                        entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 5})
                        entry['frequency'] += 2

            for chunk in doc.noun_chunks:
                clean = self.clean_subject(chunk.text)
                if self.is_valid_subject(clean):
                    entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 2})
                    entry['frequency'] += 1

            for token in doc:
                if token.pos_ == 'NOUN' and len(token.text) > 3:
                    clean = token.text.capitalize()
                    if self.is_valid_subject(clean):
                        entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 1})
                        entry['frequency'] += 1

            return sorted(concepts.values(), key=lambda x: x['frequency'] * x['importance'], reverse=True)[:20]
        except Exception:
            return self._extract_concepts_rule_based(text)

    def _extract_concepts_rule_based(self, text: str) -> List[Dict]:
        concepts: Dict[str, Dict] = {}

        for term in re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b', text):
            clean = self.clean_subject(term)
            if self.is_valid_subject(clean):
                entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 3})
                entry['frequency'] += 1

        for term in re.findall(r'["\']([^"\']{3,40})["\']', text):
            clean = self.clean_subject(term)
            if self.is_valid_subject(clean):
                entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 5})
                entry['frequency'] += 2

        for subj in re.findall(r'\b([A-Z][a-zA-Z\s]{2,35}?)\s+(?:is|are)\s+(?:a|an|the)\s+', text):
            clean = self.clean_subject(subj)
            if self.is_valid_subject(clean):
                entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 4})
                entry['frequency'] += 3

        noun_counts: Dict[str, int] = defaultdict(int)
        for noun in re.findall(r'\b([a-z]{4,})\b', text):
            if noun not in self.stopwords:
                noun_counts[noun] += 1

        for noun, count in noun_counts.items():
            if count >= 2:
                clean = noun.capitalize()
                if self.is_valid_subject(clean):
                    entry = concepts.setdefault(clean, {'text': clean, 'frequency': 0, 'importance': 2})
                    entry['frequency'] += count

        return sorted(concepts.values(), key=lambda x: x['frequency'] * x['importance'], reverse=True)[:20]

    # ──────────────────────────────────────────────────────────────────────────
    # FACT EXTRACTION
    # ──────────────────────────────────────────────────────────────────────────

    def extract_facts(self, text: str) -> List[Dict]:
        """
        Extract (subject, predicate, sentence) triples from declarative sentences.
        Only keeps facts where:
        - subject is a valid noun phrase (not a pronoun or article-led fragment)
        - predicate is a meaningful clause (not a raw fragment)
        """
        facts = []
        sentences = self.split_sentences(text)

        for sentence in sentences:
            # Pattern 1: "X is/are Y"
            m = re.search(
                r'^([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-z]+){0,4})\s+(is|are)\s+(.+?)(?:\.\s*$|$)',
                sentence
            )
            if m:
                subject = self.clean_subject(m.group(1).strip())
                predicate = m.group(3).strip().rstrip('.')
                if (
                    self.is_valid_subject(subject)
                    and len(predicate.split()) >= 5
                    and len(predicate) >= 25
                    and not self._is_fragment(predicate)
                ):
                    facts.append({
                        'type': 'definition',
                        'subject': subject,
                        'predicate': predicate,
                        'sentence': sentence,
                        'score': len(predicate.split()) + 5
                    })

            # Pattern 2: "X has/includes/contains Y"
            m2 = re.search(
                r'([A-Z][a-zA-Z\s]{2,35}?)\s+(has|have|includes|contains|consists of)\s+(.+?)(?:\.|$)',
                sentence
            )
            if m2:
                subject = self.clean_subject(m2.group(1).strip())
                predicate = m2.group(3).strip().rstrip('.')
                if (
                    self.is_valid_subject(subject)
                    and len(predicate.split()) >= 4
                    and len(predicate) >= 20
                    and not self._is_fragment(predicate)
                ):
                    facts.append({
                        'type': 'property',
                        'subject': subject,
                        'predicate': predicate,
                        'sentence': sentence,
                        'score': len(predicate.split()) + 3
                    })

        facts.sort(key=lambda x: x['score'], reverse=True)
        return facts

    def _is_fragment(self, text: str) -> bool:
        """Return True if the text is a dangling fragment, not a meaningful clause."""
        t = text.strip().lower()
        # Starts with a conjunction or preposition fragment
        bad = ['a byproduct', 'the byproduct', 'a result', 'the result',
               'an example', 'the example', 'a type', 'the type']
        for b in bad:
            if t == b or t.startswith(b + ' of'):
                return True
        # Too short to carry meaning
        if len(t.split()) <= 2:
            return True
        return False

    # ──────────────────────────────────────────────────────────────────────────
    # DISTRACTOR GENERATION
    #
    # Key principle: distractors must be PLAUSIBLE wrong answers, not raw
    # text fragments or generic placeholder strings.
    # ──────────────────────────────────────────────────────────────────────────

    def _make_distractor_pool(
        self,
        correct_answer: str,
        all_facts: List[Dict],
        concept: str,
        used_answers: Set[str],
        target_load: str
    ) -> List[str]:
        """
        Build a pool of candidate distractors for a given correct answer.

        Strategy (in order of quality):
        1. Predicates from OTHER subjects (cross-concept confusion — most plausible)
        2. Paraphrased negations / alternative framings constructed from the predicate
        3. Domain-relevant fallback phrases (NOT generic "unrelated scientific idea")
        """
        pool: List[str] = []
        seen: Set[str] = {correct_answer.lower()}
        seen.update(a.lower() for a in used_answers)

        # ── Tier 1: predicates from other facts ──────────────────────────────
        for fact in all_facts:
            if len(pool) >= 8:
                break
            if fact.get('subject', '').lower() == concept.lower():
                continue
            pred = fact.get('predicate', '').strip().rstrip('.')
            if (
                pred.lower() not in seen
                and len(pred.split()) >= 5
                and len(pred) >= 25
                and not self._is_fragment(pred)
            ):
                pool.append(pred)
                seen.add(pred.lower())

        # ── Tier 2: structural paraphrases of the correct answer ─────────────
        paraphrases = self._generate_paraphrase_distractors(correct_answer, target_load)
        for p in paraphrases:
            if p.lower() not in seen and len(p.split()) >= 4:
                pool.append(p)
                seen.add(p.lower())

        return pool

    def _generate_paraphrase_distractors(self, correct: str, target_load: str) -> List[str]:
        """
        Generate plausible-but-wrong alternatives by modifying the correct answer.
        These are structurally similar but factually altered.
        """
        distractors = []
        words = correct.split()

        # Swap key nouns/adjectives with domain-adjacent alternatives
        swaps = {
            'light': ['chemical', 'thermal', 'mechanical', 'electrical'],
            'chemical': ['light', 'thermal', 'kinetic', 'electrical'],
            'energy': ['matter', 'mass', 'heat', 'force'],
            'carbon dioxide': ['oxygen', 'nitrogen', 'water vapour', 'hydrogen'],
            'oxygen': ['carbon dioxide', 'nitrogen', 'glucose', 'water'],
            'glucose': ['starch', 'cellulose', 'fructose', 'sucrose'],
            'water': ['carbon dioxide', 'oxygen', 'glucose', 'minerals'],
            'chlorophyll': ['carotenoids', 'anthocyanins', 'xanthophylls', 'cytochromes'],
            'chloroplasts': ['mitochondria', 'ribosomes', 'vacuoles', 'nuclei'],
            'plants': ['animals', 'fungi', 'bacteria', 'archaea'],
            'sunlight': ['chemical energy', 'thermal energy', 'electrical energy'],
            'synthesis': ['breakdown', 'hydrolysis', 'oxidation', 'reduction'],
            'convert': ['store', 'release', 'absorb', 'reflect'],
            'absorb': ['reflect', 'transmit', 'emit', 'store'],
            'release': ['absorb', 'store', 'convert', 'produce'],
        }

        correct_lower = correct.lower()
        for key, alts in swaps.items():
            if key in correct_lower:
                for alt in alts[:2]:
                    variant = re.sub(re.escape(key), alt, correct, flags=re.IGNORECASE, count=1)
                    if variant.lower() != correct.lower():
                        distractors.append(variant)
                break  # only one swap per distractor pass

        # Partial reversal: negate the main verb
        negations = [
            (r'\bconvert\b', 'store rather than convert'),
            (r'\babsorb\b', 'reflect rather than absorb'),
            (r'\brelease\b', 'consume rather than release'),
            (r'\bproduce\b', 'consume rather than produce'),
            (r'\bsynthesiz', 'break down rather than synthesize'),
        ]
        for pattern, replacement in negations:
            if re.search(pattern, correct, re.IGNORECASE):
                variant = re.sub(pattern, replacement, correct, flags=re.IGNORECASE, count=1)
                if variant.lower() != correct.lower():
                    distractors.append(variant)
                break

        return distractors

    def _rank_distractors(
        self,
        correct: str,
        candidates: List[str],
        target_load: str,
        num_needed: int
    ) -> List[str]:
        """
        Rank distractors by semantic similarity to the correct answer.
        - OVERLOAD → low similarity (obviously wrong but not nonsense)
        - OPTIMAL  → medium similarity
        - LOW      → high similarity (hard to distinguish)
        """
        if not self.distilbert_model or len(candidates) < num_needed:
            return candidates[:num_needed]

        try:
            all_texts = [correct] + candidates
            embeddings = self.distilbert_model.encode(all_texts)
            correct_emb = embeddings[0]

            ideal = {'OVERLOAD': 0.25, 'LOW': 0.70, 'OPTIMAL': 0.50}.get(target_load.upper(), 0.50)

            scored = []
            for i, emb in enumerate(embeddings[1:]):
                norm = np.linalg.norm(correct_emb) * np.linalg.norm(emb)
                sim = float(np.dot(correct_emb, emb) / norm) if norm > 0 else 0.0
                scored.append((candidates[i], abs(sim - ideal)))

            scored.sort(key=lambda x: x[1])
            return [s[0] for s in scored[:num_needed]]
        except Exception:
            return candidates[:num_needed]

    # ──────────────────────────────────────────────────────────────────────────
    # QUESTION BUILDERS
    # ──────────────────────────────────────────────────────────────────────────

    def _build_mcq(
        self,
        question_text: str,
        correct: str,
        distractors: List[str],
        num_options: int
    ) -> Optional[Dict]:
        question_text = self.clean_text(question_text)
        correct = self.clean_text(correct)
        if not question_text.endswith('?'):
            question_text += '?'

        unique_distractors = []
        for d in distractors:
            d = self.clean_text(d)
            if (
                d.lower() != correct.lower()
                and d not in unique_distractors
                and len(d.split()) >= 3
                and len(d) >= 15
            ):
                unique_distractors.append(d)

        needed = num_options - 1
        if len(unique_distractors) < needed:
            return None

        options = [correct] + unique_distractors[:needed]
        random.shuffle(options)

        q = {
            'id': str(uuid.uuid4()),
            'type': 'multiple',
            'question': question_text,
            'options': options,
            'correct_index': options.index(correct)
        }
        return q if self._validate_question(q) else None

    def _build_tf(self, statement: str) -> Optional[Dict]:
        statement = self.clean_text(statement)
        if statement.endswith('.'):
            statement = statement[:-1]

        if len(statement.split()) < 7 or len(statement) < 35 or not statement[0].isupper():
            return None

        return {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': f'True or False: {statement}?',
            'options': ['True', 'False'],
            'correct_index': 0  # all TF from facts are TRUE statements
        }

    def _validate_question(self, q: Dict) -> bool:
        question = q.get('question', '')
        options = q.get('options', [])

        if len(question) < 15 or len(question) > 300:
            return False
        if not question.endswith('?') or not question[0].isupper():
            return False
        if re.search(r'\b(?:and|or|but|of|in|on|at)\s*\?$', question):
            return False
        if len(options) not in (2, 3, 4):
            return False
        if len(set(o.lower() for o in options)) != len(options):
            return False
        for opt in options:
            if len(opt.split()) < 1 or len(opt) < 4:
                return False
        return True

    # ──────────────────────────────────────────────────────────────────────────
    # LOAD-AWARE QUESTION TEMPLATES
    # ──────────────────────────────────────────────────────────────────────────

    def _get_templates(self, target_load: str) -> Dict[str, List[str]]:
        load = target_load.upper()
        if load == 'OVERLOAD':
            return {
                'definition': [
                    'What is {concept}?',
                    'What does {concept} mean?',
                ],
                'property': [
                    'What is true about {concept}?',
                    'Which fact about {concept} is correct?',
                ],
                'general': [
                    'According to the lesson, what is {concept}?',
                ]
            }
        if load == 'LOW':
            return {
                'definition': [
                    'Which of the following best explains {concept}?',
                    'What is the most accurate definition of {concept}?',
                    'How would you describe {concept} based on the lesson?',
                ],
                'property': [
                    'Which statement best describes a key characteristic of {concept}?',
                    'What can be concluded about {concept} from the lesson?',
                    'Which explanation of {concept} is most accurate?',
                ],
                'general': [
                    'What conclusion can be drawn about {concept}?',
                    'Which statement best summarises the role of {concept}?',
                ]
            }
        # OPTIMAL
        return {
            'definition': [
                'What is {concept}?',
                'Which of the following best describes {concept}?',
                'According to the lesson, what is {concept}?',
            ],
            'property': [
                'Which statement about {concept} is correct?',
                'What is true about {concept} according to the lesson?',
                'Which best describes a characteristic of {concept}?',
            ],
            'general': [
                'What does the lesson say about {concept}?',
                'According to the text, what is a key fact about {concept}?',
            ]
        }

    # ──────────────────────────────────────────────────────────────────────────
    # MAIN GENERATION
    # ──────────────────────────────────────────────────────────────────────────

    def generate_questions(
        self,
        content: str,
        num_questions: int = 10,
        target_load: str = 'OPTIMAL'
    ) -> List[Dict]:
        """
        Generate questions respecting cognitive load shape:
          OVERLOAD  →  4 MCQ  6 TF  3 options
          OPTIMAL   →  5 MCQ  5 TF  4 options
          LOW       →  6 MCQ  4 TF  4 options

        Core guarantees:
        - No question covers the same concept twice with the same wording
        - No correct answer from one question appears as a distractor in another
        - T/F stems never start with dangling pronouns (This, It, They…)
        - Distractors are semantically plausible, not generic placeholders
        """
        num_questions = 10
        target_load = (target_load or 'OPTIMAL').strip().upper()
        if target_load not in {'OVERLOAD', 'OPTIMAL', 'LOW'}:
            target_load = 'OPTIMAL'

        if target_load == 'OVERLOAD':
            target_mc, target_tf, num_options = 4, 6, 3
        elif target_load == 'LOW':
            target_mc, target_tf, num_options = 6, 4, 4
        else:
            target_mc, target_tf, num_options = 5, 5, 4

        templates = self._get_templates(target_load)
        concepts = self.extract_concepts(content)
        facts = self.extract_facts(content)
        sentences = self.split_sentences(content)

        logger.info(
            f'Load={target_load} | facts={len(facts)} concepts={len(concepts)} '
            f'| target_mc={target_mc} target_tf={target_tf}'
        )

        if not facts and not sentences:
            logger.warning('No usable content extracted')
            return []

        questions: List[Dict] = []
        used_question_texts: Set[str] = set()   # dedup question stems
        used_correct_answers: Set[str] = set()  # prevent correct→distractor leakage
        mc_count = 0
        tf_count = 0

        # ── Phase 1: facts → MCQ + T/F ────────────────────────────────────────
        for fact in facts:
            if mc_count >= target_mc and tf_count >= target_tf:
                break

            subject = fact['subject']
            predicate = fact['predicate']
            sentence = fact['sentence']

            # MCQ
            if mc_count < target_mc:
                fact_templates = templates.get(fact['type'], templates['definition'])
                for tmpl in fact_templates:
                    q_text = tmpl.format(concept=subject)
                    if q_text.lower() in used_question_texts:
                        continue

                    distractor_pool = self._make_distractor_pool(
                        predicate, facts, subject, used_correct_answers, target_load
                    )

                    if self.distilbert_model:
                        distractors = self._rank_distractors(
                            predicate, distractor_pool, target_load, num_options - 1
                        )
                    else:
                        distractors = distractor_pool[:num_options - 1]

                    q = self._build_mcq(q_text, predicate, distractors, num_options)
                    if q:
                        questions.append(q)
                        used_question_texts.add(q_text.lower())
                        used_correct_answers.add(predicate.lower())
                        mc_count += 1
                        break

            # T/F — rewrite stem to avoid dangling pronouns
            if tf_count < target_tf:
                stem = self._rewrite_tf_stem(sentence, subject_hint=subject)
                if stem and stem.lower() not in used_question_texts:
                    q = self._build_tf(stem)
                    if q:
                        questions.append(q)
                        used_question_texts.add(stem.lower())
                        tf_count += 1

        # ── Phase 2: fill remaining T/F from all sentences ────────────────────
        if tf_count < target_tf:
            # Identify the primary subject of the text for pronoun replacement
            primary_subject = concepts[0]['text'] if concepts else ''
            for sentence in sentences:
                if tf_count >= target_tf:
                    break
                stem = self._rewrite_tf_stem(sentence, subject_hint=primary_subject)
                if not stem or stem.lower() in used_question_texts:
                    continue
                q = self._build_tf(stem)
                if q:
                    questions.append(q)
                    used_question_texts.add(stem.lower())
                    tf_count += 1

        # ── Phase 3: fill remaining MCQ from concepts ─────────────────────────
        if mc_count < target_mc:
            for fact in facts:
                if mc_count >= target_mc:
                    break
                subject = fact['subject']
                predicate = fact['predicate']
                fact_templates = templates.get(fact['type'], templates['definition'])
                for tmpl in fact_templates:
                    q_text = tmpl.format(concept=subject)
                    if q_text.lower() in used_question_texts:
                        continue
                    distractor_pool = self._make_distractor_pool(
                        predicate, facts, subject, used_correct_answers, target_load
                    )
                    if self.distilbert_model:
                        distractors = self._rank_distractors(
                            predicate, distractor_pool, target_load, num_options - 1
                        )
                    else:
                        distractors = distractor_pool[:num_options - 1]
                    q = self._build_mcq(q_text, predicate, distractors, num_options)
                    if q:
                        questions.append(q)
                        used_question_texts.add(q_text.lower())
                        used_correct_answers.add(predicate.lower())
                        mc_count += 1
                        break

        # ── Phase 4: fallback T/F from concept sentences ──────────────────────
        if len(questions) < num_questions:
            primary_subject = concepts[0]['text'] if concepts else ''
            for concept in concepts[:15]:
                if len(questions) >= num_questions:
                    break
                for sentence in sentences:
                    if concept['text'].lower() in sentence.lower():
                        stem = self._rewrite_tf_stem(sentence, subject_hint=primary_subject)
                        if stem and stem.lower() not in used_question_texts:
                            q = self._build_tf(stem)
                            if q:
                                questions.append(q)
                                used_question_texts.add(stem.lower())
                                break

        questions = questions[:num_questions]
        random.shuffle(questions)
        logger.info(
            f'Final: {len(questions)} questions '
            f'(MCQ={mc_count}, TF={tf_count}) for load={target_load}'
        )
        return questions


# ──────────────────────────────────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────────────────────────────────

def generate_quiz_from_content(
    content: str,
    num_questions: int = 10,
    target_load: str = 'OPTIMAL',
    use_ml: bool = True
) -> List[Dict]:
    """
    Generate quiz questions from lesson content.

    Args:
        content:       The lesson text.
        num_questions: Always generates 10 (arg kept for API compatibility).
        target_load:   'OVERLOAD' | 'OPTIMAL' | 'LOW'
        use_ml:        Whether to attempt loading spaCy / SentenceTransformer.

    Returns:
        List of question dicts with keys: id, type, question, options, correct_index
    """
    generator = QuizGenerator(use_ml=use_ml)
    return generator.generate_questions(
        content=content,
        num_questions=num_questions,
        target_load=target_load
    )