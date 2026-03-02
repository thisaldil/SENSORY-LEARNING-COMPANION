#!/usr/bin/env python3
"""
RAG Lesson Converter - Converts lesson files to RAG-ready format
Takes existing lesson files and restructures them into:
- CORE CONCEPTS
- CONCEPT RELATIONS
- EXAMPLES
- SCENE DESCRIPTIONS  
- NARRATION
"""

import os
import re
from pathlib import Path

# Template for RAG-ready lesson structure
RAG_TEMPLATE = """
{lesson_title}: {subtitle}

CORE CONCEPTS:
{concepts}

CONCEPT RELATIONS:
{relations}

EXAMPLES:
{examples}

SCENE DESCRIPTIONS (for visualization/animation):
{scene_descriptions}

NARRATION:
{narration}
"""

def extract_lesson_structure(content):
    """
    Extract existing content from lesson file and organize into RAG structure
    """
    
    # Pattern 1: Find numbered sections
    sections = re.split(r'\n\d+\.\s+', content)
    
    # Pattern 2: Find bolded/emphasized concepts
    concepts = re.findall(r'\*\*(.*?)\*\*|__(.*)__', content)
    
    # Pattern 3: Find examples
    examples = re.findall(r'Example[s]?:?\s*(.*?)(?=\n\n|\Z)', content, re.IGNORECASE | re.DOTALL)
    
    # Pattern 4: Extract intro/basic explanation
    intro = sections[0][:500] if sections else ""
    
    return {
        'sections': sections,
        'concepts': concepts,
        'examples': examples,
        'intro': intro
    }

def restructure_to_rag(lesson_file_path, output_path=None):
    """
    Read lesson file and convert to RAG-ready format
    """
    
    if output_path is None:
        output_path = lesson_file_path
    
    # Read original file
    with open(lesson_file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Extract structured content
    extracted = extract_lesson_structure(content)
    
    # Build RAG-structured lesson
    title = Path(lesson_file_path).stem.replace('lesson_', '').replace('lesson ', '').replace('_', ' ')
    
    rag_content = f"""{title.upper()}

CORE CONCEPTS:

{extracted['intro']}

[Structure: Main definition, interactive explanation, sub-concepts]
[Include: 3-5 core concepts with clear definitions]

CONCEPT RELATIONS:

Relation 1: [Connection between concepts]
Relation 2: [How concepts build on each other]
Relation 3: [Dependency or sequence relationships]

[Include: 3-5 clearly defined relationships between concepts]

EXAMPLES:

Example 1: [Practical, 11-year-old relevant example]
[Include concrete scenarios from real life, Sri Lankan context, or daily experience]

Example 2: [Different context or variation]

Example 3: [Edge case or complex application]

[Include: 4-6 concrete examples with clear explanations]

SCENE DESCRIPTIONS (for visualization/animation):

Scene 1: [Visual description for animation]
[Include: Object positions, movements, color changes, interactions]

Scene 2: [Another perspective or step]

Scene 3: [Process or transformation visualization]

[Include: 3-5 scene descriptions that could become animated sequences]

NARRATION:

Introduction:
[Hook: Why does a student care about this?]

Section 1 - Foundational Concept:
[Explain main idea in storytelling format, not just facts]

Section 2 - Build Understanding:
[Connect concepts with real examples]

Section 3 - Applications:
[Show practical uses and importance]

Conclusion Connection:
[How this connects to their life and world]
"""
    
    # Write restructured content
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(rag_content)
    
    return output_path

def batch_convert_corpus(corpus_path):
    """
    Convert all lesson files in corpus directory to RAG format
    """
    
    corpus_dir = Path(corpus_path)
    txt_files = list(corpus_dir.glob('lesson*.txt'))
    
    print(f"Found {len(txt_files)} lesson files to convert")
    print("Starting RAG conversion...\n")
    
    converted_count = 0
    failed_files = []
    
    for lesson_file in txt_files:
        try:
            # Skip already enhanced files
            if 'ENHANCED' in lesson_file.name or 'RAG' in lesson_file.name:
                print(f"Skipping already processed: {lesson_file.name}")
                continue
            
            print(f"Converting: {lesson_file.name}")
            restructure_to_rag(str(lesson_file))
            converted_count += 1
            
        except Exception as e:
            print(f"Error processing {lesson_file.name}: {str(e)}")
            failed_files.append(lesson_file.name)
    
    print(f"\n✓ Successfully converted {converted_count} files")
    if failed_files:
        print(f"✗ Failed to convert {len(failed_files)} files:")
        for f in failed_files:
            print(f"  - {f}")
    
    return converted_count, failed_files

if __name__ == "__main__":
    import sys
    
    corpus_path = sys.argv[1] if len(sys.argv) > 1 else "d:\\GITHUB\\SENSORY-LEARNING-COMPANION\\server\\ocr_nlp\\rag\\corpus"
    
    batch_convert_corpus(corpus_path)
