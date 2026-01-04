# Quiz Generator Guide

A hybrid rule-based + ML quiz generation system for educational content.

## Overview

The Quiz Generator creates multiple-choice and true/false questions from lesson content using a hybrid approach:

- **Rule-based NLP**: Baseline system for factual correctness and explainability
- **spaCy**: Enhanced concept extraction via noun phrases
- **DistilBERT**: Sentence similarity and intelligent distractor ranking
- **T5-small**: Question rewriting for better naturalness

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Download spaCy English Model

```bash
python -m spacy download en_core_web_sm
```

### 3. Verify Installation

The system will automatically detect available ML libraries and use them if installed. If ML libraries are missing, it will fall back to rule-based methods automatically.

## Usage

### Basic Usage

```python
from app.ml.processors.quiz_generator import generate_quiz_from_content

# Your lesson content
lesson_text = """
Photosynthesis is the process by which plants convert sunlight into energy.
Chlorophyll is the green pigment that captures light.
The process occurs in chloroplasts and produces oxygen as a byproduct.
"""

# Generate 10 questions (default)
questions = generate_quiz_from_content(lesson_text, num_questions=10)

# Generate 5 questions with ML enhancements (default)
questions = generate_quiz_from_content(lesson_text, num_questions=5, use_ml=True)

# Generate questions using only rule-based methods
questions = generate_quiz_from_content(lesson_text, num_questions=5, use_ml=False)
```

### Using the QuizGenerator Class

```python
from app.ml.processors.quiz_generator import QuizGenerator

# Initialize generator
generator = QuizGenerator(use_ml=True)  # Use ML enhancements

# Generate questions
questions = generator.generate_questions(lesson_text, num_questions=10)
```

## Question Format

Each question is a dictionary with the following structure:

```python
{
    'id': 'uuid-string',
    'type': 'multiple' or 'truefalse',
    'question': 'Question text here',
    'options': ['Option 1', 'Option 2', 'Option 3', 'Option 4'],  # For multiple choice
    'correct_index': 0  # Index of correct answer in options array
}
```

### Example Output

```python
[
    {
        'id': '123e4567-e89b-12d3-a456-426614174000',
        'type': 'multiple',
        'question': 'What is photosynthesis?',
        'options': [
            'The process by which plants convert sunlight into energy',
            'A type of plant cell',
            'The green pigment in leaves',
            'None of the above'
        ],
        'correct_index': 0
    },
    {
        'id': '223e4567-e89b-12d3-a456-426614174001',
        'type': 'truefalse',
        'question': 'True or False: Photosynthesis produces oxygen as a byproduct',
        'options': ['True', 'False'],
        'correct_index': 0
    }
]
```

## Configuration Options

### ML Enhancement Modes

#### 1. Full Hybrid Mode (Recommended)

```python
generator = QuizGenerator(use_ml=True)
```

- Uses rule-based extraction + spaCy enhancement
- Uses DistilBERT for distractor ranking
- Uses T5-small for question rewriting
- **Best quality**, requires ML libraries

#### 2. Rule-Based Only

```python
generator = QuizGenerator(use_ml=False)
```

- Pure rule-based NLP
- No ML dependencies required
- Faster, more explainable
- Lower quality but reliable

#### 3. Automatic Fallback

If ML libraries aren't available, the system automatically falls back to rule-based methods with warnings logged.

## Question Types

The generator creates two types of questions:

1. **Multiple Choice (60% of total)**

   - Definition questions: "What is X?"
   - Relationship questions: "How does X relate to Y?"
   - Factual questions: "According to the lesson, what is true about X?"

2. **True/False (40% of total)**
   - Statement evaluation questions
   - Mix of true and false statements

## How It Works

### Hybrid Pipeline

```
Lesson Content
     ↓
[Rule-Based Extraction] + [spaCy Noun Phrases]
     ↓
Key Concepts & Facts
     ↓
[Rule-Based Question Templates] → [T5 Rewriting (optional)]
     ↓
[Rule-Based Distractors] → [DistilBERT Ranking]
     ↓
Final Quiz Questions
```

### Component Details

1. **Concept Extraction**

   - Rule-based: Capitalized terms, quoted terms, frequent words
   - spaCy: Noun phrases, named entities, important nouns
   - Combined for best results

2. **Fact Extraction**

   - Pattern matching for definitions, relationships, cause-effect
   - Extracts structured facts from sentences

3. **Distractor Generation**

   - Rule-based: Related concepts, generic options
   - DistilBERT: Ranks distractors by similarity (selects plausible but distinct options)

4. **Question Improvement**
   - T5-small: Rewrites definition and relationship questions for better naturalness
   - Only applied to appropriate question types

## Integration Example

### In FastAPI Service

```python
from app.ml.processors.quiz_generator import generate_quiz_from_content

async def generate_quiz_for_lesson(lesson_content: str, num_questions: int = 10):
    # Generate questions
    questions = generate_quiz_from_content(lesson_content, num_questions)

    # Create quiz document
    quiz = Quiz(
        lesson_id=lesson_id,
        user_id=user_id,
        questions=questions
    )

    await quiz.insert()
    return quiz
```

## Troubleshooting

### ML Models Not Loading

If you see warnings like:

```
⚠️  spaCy model 'en_core_web_sm' not found
```

Solution:

```bash
python -m spacy download en_core_web_sm
```

### Out of Memory Errors

If T5 or DistilBERT cause memory issues:

- Use `use_ml=False` for rule-based only
- Or disable specific components by modifying the code

### Low Quality Questions

- Ensure your lesson content is well-structured
- Use longer, more detailed content (better extraction)
- Try with `use_ml=True` for better quality
- Increase `num_questions` to get more variety

## Performance

- **Rule-based only**: Fast (~0.1-0.5 seconds for 10 questions)
- **With ML**: Slower first run (~2-5 seconds due to model loading), then ~1-2 seconds per batch
- Models are loaded once and reused

## Research Notes

For your research documentation, you can describe the system as:

> "A hybrid quiz generation system that combines rule-based NLP (for factual correctness and explainability) with lightweight transformer models. The system uses spaCy for improved concept extraction, DistilBERT for intelligent distractor ranking via sentence similarity, and T5-small for question rewriting to improve naturalness while maintaining control over output quality."

## License

Part of the SENSORY-LEARNING-COMPANION project.
