"""
Quiz Generator
Generate quiz questions from educational content using NLP
"""
import re
import random
import uuid
from typing import List, Dict, Tuple
from collections import defaultdict

class QuizGenerator:
    """Generate quiz questions from lesson content"""
    
    def __init__(self):
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
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """
        Extract key concepts, terms, and entities from text
        
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
    
    def extract_facts(self, text: str) -> List[Dict[str, str]]:
        """
        Extract factual statements from text
        
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
    
    def generate_multiple_choice_question(
        self, 
        question_text: str, 
        correct_answer: str, 
        distractors: List[str]
    ) -> Dict:
        """
        Generate a multiple choice question
        
        Args:
            question_text: The question text
            correct_answer: The correct answer
            distractors: List of incorrect answer options
            
        Returns:
            Question dictionary
        """
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
            'question': question_text,
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
        
        return {
            'id': str(uuid.uuid4()),
            'type': 'truefalse',
            'question': f"True or False: {statement}",
            'options': ['True', 'False'],
            'correct_index': 0 if is_true else 1
        }
    
    def create_distractors(self, correct_answer: str, concepts: List[str], text: str) -> List[str]:
        """
        Create plausible distractors for multiple choice questions
        
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
    
    def generate_questions(self, lesson_content: str, num_questions: int = 10) -> List[Dict]:
        """
        Generate quiz questions from lesson content
        
        Args:
            lesson_content: The lesson text
            num_questions: Number of questions to generate (default: 10)
            
        Returns:
            List of question dictionaries
        """
        questions = []
        
        # Extract concepts and facts
        concepts = self.extract_key_concepts(lesson_content)
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
                    question_text, definition, distractors
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
                        question_text, relationship_desc, distractors
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
                
                # Extract key information from sentence
                answer = sentence[:100]  # Use first part of sentence as answer
                distractors = self.create_distractors(answer, concepts, lesson_content)
                
                question = self.generate_multiple_choice_question(
                    question_text, answer, distractors
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
                        question_text, answer, distractors
                    )
                    questions.append(question)
        
        # Shuffle questions
        random.shuffle(questions)
        
        return questions


def generate_quiz_from_content(content: str, num_questions: int = 10) -> List[Dict]:
    """
    Main function to generate quiz questions from content
    
    Args:
        content: Lesson content text
        num_questions: Number of questions to generate
        
    Returns:
        List of question dictionaries
    """
    generator = QuizGenerator()
    return generator.generate_questions(content, num_questions)
