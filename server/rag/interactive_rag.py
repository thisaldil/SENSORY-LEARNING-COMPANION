import sys
import os
import json
import re

# Add the server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from ocr_nlp.rag.retriever import build_vector_store, retrieve_context
from ocr_nlp.rag.generator import generate_response


def extract_rag_components(query, context_chunks):
    """
    Extract components for RAG template format from retrieved context
    """
    
    combined_context = "\n\n".join(context_chunks)
    
    # Extract core concepts (sentences that define or explain)
    concept_sentences = []
    for sentence in combined_context.split('.'):
        sentence = sentence.strip()
        if len(sentence) > 30 and any(word in sentence.lower() for word in ['is', 'are', 'refers', 'means', 'called']):
            concept_sentences.append(sentence)
            if len(concept_sentences) >= 3:
                break
    
    # Extract examples (sentences with "example", "for instance", "such as")
    examples = []
    for sentence in combined_context.split('.'):
        sentence = sentence.strip()
        if any(keyword in sentence.lower() for keyword in ['example', 'for instance', 'such as', 'like']):
            examples.append(sentence)
            if len(examples) >= 3:
                break
    
    # If no explicit examples found, extract practical/descriptive sentences
    if not examples:
        for sentence in combined_context.split('.'):
            sentence = sentence.strip()
            if len(sentence) > 40 and not sentence[0].isupper():
                examples.append(sentence)
                if len(examples) >= 3:
                    break
    
    # Extract relations (sentences with connecting words)
    relations = []
    for sentence in combined_context.split('.'):
        sentence = sentence.strip()
        if any(word in sentence.lower() for word in ['because', 'therefore', 'when', 'causes', 'results', 'affects']):
            relations.append(sentence)
            if len(relations) >= 2:
                break
    
    return {
        'concepts': concept_sentences[:3] if concept_sentences else ["Information found in retrieved context"],
        'relations': relations[:2] if relations else ["Relationships explained in context"],
        'examples': examples[:3] if examples else ["Examples available in full lesson"],
        'context_full': combined_context[:600]  # First 600 chars for narration base
    }


def format_rag_template(query, components, basic_response):
    """
    Format output according to RAG template structure
    """
    
    template = f"""
{'='*70}
📋 RAG STRUCTURED OUTPUT FOR: {query}
{'='*70}

CORE CONCEPTS:
"""
    
    for i, concept in enumerate(components['concepts'], 1):
        template += f"\n{i}. {concept}.\n"
    
    template += f"""
CONCEPT RELATIONS:
"""
    
    for i, relation in enumerate(components['relations'], 1):
        template += f"\n{i}. {relation}.\n"
    
    template += f"""
EXAMPLES:
"""
    
    for i, example in enumerate(components['examples'], 1):
        template += f"\n{i}. {example}.\n"
    
    template += f"""
SCENE DESCRIPTIONS (for visualization/animation):

Scene 1: Visual representation of the core concept
[Animation Ready] Display main elements and their interactions based on retrieved lesson content.

Scene 2: Step-by-step process or transformation
[Animation Ready] Show the sequence of events or changes described in the lesson.

Scene 3: Real-world application or example
[Animation Ready] Demonstrate practical usage in familiar contexts.

NARRATION:

{basic_response.get('definition', components['context_full'][:300])}

{basic_response.get('narration_script', 'Additional explanation available in full lesson context.')}

{'='*70}

JSON FORMAT:
"""
    
    json_output = {
        "query": query,
        "core_concepts": components['concepts'],
        "concept_relations": components['relations'],
        "examples": components['examples'],
        "scene_descriptions": [
            "Scene 1: Visual representation of the core concept",
            "Scene 2: Step-by-step process or transformation", 
            "Scene 3: Real-world application or example"
        ],
        "narration": {
            "definition": basic_response.get('definition', ''),
            "explanation": basic_response.get('narration_script', ''),
            "context_summary": components['context_full'][:300]
        }
    }
    
    template += "\n" + json.dumps(json_output, indent=2, ensure_ascii=False)
    template += "\n" + "="*70
    
    return template


# Build the vector store once at startup
print("=" * 70)
print("🚀 INITIALIZING RAG SYSTEM (Template Format)")
print("=" * 70)

corpus_path = os.path.join(os.path.dirname(__file__), "corpus")
print(f"\n📚 Loading lessons from: {corpus_path}")
print("⏳ Building vector store... (this may take a few seconds)")

store = build_vector_store(corpus_path)

print("✅ RAG System Ready!")
print("\n" + "=" * 70)
print("Ask questions about science lessons (type 'exit' or 'quit' to stop)")
print("Output format: RAG Template (CORE CONCEPTS, RELATIONS, EXAMPLES, SCENES, NARRATION)")
print("=" * 70)

# Interactive loop
while True:
    print("\n" + "-" * 70)
    query = input("❓ Your Question: ").strip()
    
    if query.lower() in ['exit', 'quit', 'q']:
        print("\n👋 Goodbye!")
        break
    
    if not query:
        print("⚠️  Please enter a question!")
        continue
    
    print("\n🔍 Searching lessons...")
    
    # Retrieve relevant context
    context = retrieve_context(store, query)[:3]  # Get top 3 chunks
    context = [chunk[:800] for chunk in context]
    
    print(f"✓ Found {len(context)} relevant lesson chunks")
    
    # Extract RAG components
    print("🤖 Extracting RAG components...")
    components = extract_rag_components(query, context)
    
    # Generate basic response for narration section
    print("🤖 Generating narration...")
    basic_response = generate_response(query, context[:2])
    
    # Format and display RAG template output
    rag_template_output = format_rag_template(query, components, basic_response)
    print("\n" + rag_template_output)
