---
name: langchain-text-splitting
description: Guide to splitting documents into chunks for RAG applications. Covers RecursiveCharacterTextSplitter, structure-based splitting (HTML, Markdown, JSON), chunk size optimization, and overlap strategies.
language: python
---

# langchain-text-splitting (Python)

---
name: langchain-text-splitting
description: Guide to splitting documents into chunks for RAG applications. Covers RecursiveCharacterTextSplitter, structure-based splitting (HTML, Markdown, JSON), chunk size optimization, and overlap strategies.
language: python
---

# Text Splitting with LangChain (Python)

## Overview

Text splitters break large documents into smaller chunks that can be retrieved individually and fit within model context windows. Proper chunking is critical for effective RAG applications.

### Why Split Documents?

- **Context Window Limits**: Models have finite input size
- **Retrieval Precision**: Smaller chunks = more focused results
- **Semantic Coherence**: Keep related content together
- **Cost Optimization**: Only process relevant chunks

## RecursiveCharacterTextSplitter (Recommended)

The default splitter for most use cases. Recursively splits text using hierarchical separators.

### Basic Usage

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # Maximum chunk size in characters
    chunk_overlap=200,    # Overlap between chunks
    length_function=len,  # Function to measure length
    add_start_index=True  # Track position in original doc
)

# Split text
text = "Your long document text here..."
chunks = text_splitter.split_text(text)

# Split documents
from langchain_core.documents import Document
docs = [Document(page_content=text)]
split_docs = text_splitter.split_documents(docs)

print(f"Created {len(split_docs)} chunks")
```

### How It Works

Tries separators in order: `\n\n` → `\n` → ` ` → ``

```python
# Default separators (in order of preference)
separators = [
    "\n\n",  # Paragraphs
    "\n",    # Lines
    " ",     # Words
    ""       # Characters
]

# Example
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=20,
    separators=["\n\n", "\n", " ", ""]
)
```

## Chunk Size and Overlap

### Choosing Chunk Size

| Chunk Size | Use Case | Pros | Cons |
|------------|----------|------|------|
| 200-500 | Precise Q&A | Focused results | May lose context |
| 1000-1500 | General RAG | Balanced | Standard choice |
| 2000-3000 | Document summaries | Full context | Less precise |

```python
# Small chunks - precise answers
precise_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

# Medium chunks - general use
general_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

# Large chunks - context-heavy
context_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=400
)
```

### Overlap Strategy

Overlap prevents splitting important context across chunks.

```python
# No overlap - may break context
no_overlap = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=0  # Not recommended
)

# Good overlap - maintains context
with_overlap = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200  # 20% overlap
)

# Example showing overlap
text = "A" * 1000 + "B" * 1000
chunks = with_overlap.split_text(text)
# chunk[0]: A...AAA BBB (last 200 chars have B)
# chunk[1]: BBB B...BB (first 200 chars repeat from chunk[0])
```

## Structure-Based Splitting

### Markdown Splitter

Preserves markdown structure (headers, lists, code blocks).

```python
from langchain_text_splitters import MarkdownTextSplitter

markdown_text = """
# Main Title

## Section 1
Content here...

## Section 2
More content...
"""

md_splitter = MarkdownTextSplitter(
    chunk_size=1000,
    chunk_overlap=100
)
chunks = md_splitter.split_text(markdown_text)
```

### HTML Splitter

Respects HTML structure and tags.

```python
from langchain_text_splitters import HTMLHeaderTextSplitter

html_string = """
<html>
<body>
    <h1>Main Title</h1>
    <p>Introduction...</p>
    <h2>Section 1</h2>
    <p>Content...</p>
</body>
</html>
"""

headers_to_split_on = [
    ("h1", "Header 1"),
    ("h2", "Header 2"),
    ("h3", "Header 3"),
]

html_splitter = HTMLHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on
)
chunks = html_splitter.split_text(html_string)

# Each chunk preserves header metadata
for chunk in chunks:
    print(chunk.metadata)  # {"Header 1": "Main Title", "Header 2": "Section 1"}
```

### Code Splitter

Language-aware code splitting.

```python
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    Language
)

python_code = """
def function1():
    pass

def function2():
    pass

class MyClass:
    def method(self):
        pass
"""

# Python-specific splitter
python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=500,
    chunk_overlap=0
)
chunks = python_splitter.split_text(python_code)
```

### JSON Splitter

Preserves JSON structure.

```python
from langchain_text_splitters import RecursiveJsonSplitter

json_data = {
    "users": [
        {"name": "Alice", "email": "alice@example.com"},
        {"name": "Bob", "email": "bob@example.com"}
    ],
    "settings": {
        "theme": "dark",
        "language": "en"
    }
}

json_splitter = RecursiveJsonSplitter(
    max_chunk_size=100
)
chunks = json_splitter.split_json(json_data)
```

## Token-Based Splitting

Split based on token count instead of characters.

```python
from langchain_text_splitters import CharacterTextSplitter

# Using tiktoken for OpenAI models
token_splitter = CharacterTextSplitter.from_tiktoken_encoder(
    encoding_name="cl100k_base",  # GPT-4, GPT-3.5-turbo
    chunk_size=100,               # 100 tokens
    chunk_overlap=0
)

text = "Your text here..."
chunks = token_splitter.split_text(text)
```

## Working with Documents

### Split Loaded Documents

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Load PDF
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# Split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True
)
all_splits = text_splitter.split_documents(docs)

# Metadata is preserved
for split in all_splits[:3]:
    print(f"Source: {split.metadata['source']}")
    print(f"Page: {split.metadata['page']}")
    print(f"Start index: {split.metadata.get('start_index')}")
    print(f"Content: {split.page_content[:100]}...\n")
```

### Add Custom Metadata

```python
# Split and enhance metadata
splits = text_splitter.split_documents(docs)

for i, split in enumerate(splits):
    split.metadata["chunk_id"] = i
    split.metadata["total_chunks"] = len(splits)
    split.metadata["chunk_size"] = len(split.page_content)
```

## Decision Table: Choosing a Splitter

| Content Type | Splitter | Settings |
|--------------|----------|----------|
| Plain text | `RecursiveCharacterTextSplitter` | chunk_size=1000, overlap=200 |
| Markdown docs | `MarkdownTextSplitter` | Preserves headers |
| HTML pages | `HTMLHeaderTextSplitter` | Split on headers |
| Code files | `RecursiveCharacterTextSplitter.from_language()` | Language-specific |
| JSON data | `RecursiveJsonSplitter` | Structure-aware |
| Token limits | `CharacterTextSplitter.from_tiktoken_encoder()` | Exact token count |

## Advanced Techniques

### 1. Semantic Splitting

Split based on meaning changes (experimental).

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

semantic_splitter = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile"
)
chunks = semantic_splitter.split_text(text)
```

### 2. Custom Separators

```python
# Split on custom markers
custom_splitter = RecursiveCharacterTextSplitter(
    separators=["###", "\n\n", "\n", " "],
    chunk_size=1000,
    chunk_overlap=100
)
```

### 3. Length Function

```python
# Use token counter as length function
import tiktoken

def tiktoken_len(text):
    encoder = tiktoken.get_encoding("cl100k_base")
    return len(encoder.encode(text))

token_aware_splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=10,
    length_function=tiktoken_len
)
```

## Best Practices

### 1. Match Chunk Size to Use Case

```python
# Q&A over documentation
qa_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150
)

# Long-form content analysis
analysis_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=400
)
```

### 2. Test Different Sizes

```python
def test_chunk_sizes(text, sizes=[500, 1000, 1500]):
    """Test different chunk sizes."""
    for size in sizes:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=size,
            chunk_overlap=int(size * 0.1)
        )
        chunks = splitter.split_text(text)
        print(f"Size {size}: {len(chunks)} chunks")
        print(f"  Avg length: {sum(len(c) for c in chunks) / len(chunks):.0f}")
```

### 3. Preserve Metadata

```python
# Always use split_documents to keep metadata
splits = text_splitter.split_documents(docs)  # ✅ Keeps metadata
# Not: chunks = text_splitter.split_text(text)  # ❌ Loses metadata
```

## Explicit Boundaries

### ✅ Agents CAN:
- Split text by characters, tokens, or semantic boundaries
- Preserve document structure (headers, code blocks)
- Configure chunk size and overlap
- Track chunk position in original document
- Split multiple documents in batch
- Handle various content types (markdown, HTML, JSON, code)

### ❌ Agents CANNOT:
- Automatically determine optimal chunk size
- Understand semantic meaning without embeddings
- Prevent all context loss at split boundaries
- Split without some information loss
- Guarantee chunks fit exact token limits (character-based)
- Maintain perfect document structure across splits

## Gotchas

1. **Character vs Token Count**: chunk_size is in characters, not tokens
   ```python
   # 1000 characters ≈ 250-300 tokens for English text
   chunk_size=1000  # This is characters!
   ```

2. **Overlap is Included in Chunk Size**: Overlap chars count toward chunk_size
   ```python
   # Effective unique content per chunk
   unique_content = chunk_size - chunk_overlap
   ```

3. **add_start_index for Tracking**: Essential for citing sources
   ```python
   text_splitter = RecursiveCharacterTextSplitter(
       chunk_size=1000,
       chunk_overlap=200,
       add_start_index=True  # Adds 'start_index' to metadata
   )
   ```

4. **Metadata Preservation**: Use split_documents, not split_text
   ```python
   # Preserves metadata ✅
   splits = text_splitter.split_documents(docs)
   
   # Loses metadata ❌
   texts = [doc.page_content for doc in docs]
   chunks = text_splitter.split_text("\n\n".join(texts))
   ```

5. **Empty Chunks**: Can occur with small chunk_size
   ```python
   # May create empty chunks if text has long separator sequences
   # Filter them out
   splits = [s for s in splits if s.page_content.strip()]
   ```

## Full Documentation

- [Text Splitters Overview](https://docs.langchain.com/oss/python/integrations/splitters/index)
- [RecursiveCharacterTextSplitter](https://docs.langchain.com/oss/python/integrations/splitters/index#text-structure-based)
- [Splitting Tutorial](https://docs.langchain.com/oss/python/langchain/rag#splitting-documents)
