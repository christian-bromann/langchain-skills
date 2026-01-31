---
name: langchain-document-loaders
description: Guide to loading and processing documents in LangChain, including PDF loaders, web scrapers, text splitters (RecursiveCharacterTextSplitter), and various file format loaders for RAG pipelines.
language: python
---

# langchain-document-loaders (Python)

---
name: langchain-document-loaders
description: Guide to loading and processing documents in LangChain, including PDF loaders, web scrapers, text splitters (RecursiveCharacterTextSplitter), and various file format loaders for RAG pipelines.
language: python
---

# LangChain Document Loaders (Python)

## Overview

Document loaders provide a standard interface for loading data from various sources into LangChain's `Document` format. They are the first step in building RAG (Retrieval-Augmented Generation) systems and knowledge bases.

Key capabilities:
- **Load from multiple sources**: PDFs, web pages, files, APIs
- **Standard format**: All loaders return `Document` objects with content and metadata
- **Text splitting**: Break large documents into manageable chunks
- **Metadata extraction**: Preserve source information for citations

## Decision Tables

### Which Document Loader Should I Use?

| Source Type | Recommended Loader | Use Case |
|-------------|-------------------|----------|
| PDF files | `PyPDFLoader` or `PyMuPDFLoader` | Extract text from PDF documents |
| Web pages | `WebBaseLoader` | Scrape web content |
| JavaScript-heavy sites | `PlaywrightURLLoader` | Sites requiring JS rendering |
| Text files | `TextLoader` | Plain text documents |
| JSON | `JSONLoader` | Structured JSON data |
| CSV | `CSVLoader` | Tabular data |
| Markdown | `UnstructuredMarkdownLoader` | Markdown documents |
| Microsoft Word | `Docx2txtLoader` | .docx files |
| Directory of files | `DirectoryLoader` | Batch load multiple files |
| YouTube videos | `YoutubeLoader` | Video transcripts |
| Google Drive | `GoogleDriveLoader` | Cloud documents |
| Notion | `NotionDBLoader` | Notion pages and databases |

### Which Text Splitter Should I Use?

| Splitter | Best For | Why |
|----------|----------|-----|
| `RecursiveCharacterTextSplitter` | General text | Most versatile, preserves structure |
| `CharacterTextSplitter` | Simple splitting | Fast, basic character-based |
| `TokenTextSplitter` | LLM context windows | Respects token limits |
| `MarkdownTextSplitter` | Markdown docs | Preserves markdown structure |
| `PythonCodeTextSplitter` | Python code | Language-aware splitting |

## Code Examples

### 1. PDF Document Loader

**Installation:**
```bash
pip install pypdf
```

**Basic PDF Loading:**
```python
from langchain_community.document_loaders import PyPDFLoader

# Load a PDF file
loader = PyPDFLoader("path/to/document.pdf")

# Load returns list of Document objects (one per page)
docs = loader.load()

print(f"Loaded {len(docs)} pages")
print(f"First page: {docs[0].page_content[:200]}")
print(f"Metadata: {docs[0].metadata}")
```

**Loading Specific Pages:**
```python
# Load all pages
pages = loader.load_and_split()

# Access specific page
first_page = docs[0]
print(f"Page {first_page.metadata['page']}: {first_page.page_content[:100]}")
```

**Alternative: PyMuPDF (Faster):**
```bash
pip install pymupdf
```

```python
from langchain_community.document_loaders import PyMuPDFLoader

loader = PyMuPDFLoader("document.pdf")
docs = loader.load()
```

### 2. Web Page Loader

**Installation:**
```bash
pip install beautifulsoup4
```

**Basic Web Scraping:**
```python
from langchain_community.document_loaders import WebBaseLoader

# Load a web page
loader = WebBaseLoader("https://python.langchain.com/docs/introduction/")
docs = loader.load()

print(f"Page content: {docs[0].page_content[:500]}")
print(f"Source: {docs[0].metadata['source']}")
```

**Filtering Specific Content:**
```python
# Load only specific elements using BeautifulSoup
loader = WebBaseLoader(
    web_paths=["https://example.com/blog"],
    bs_kwargs={
        "parse_only": bs4.SoupStrainer(
            class_=("post-content", "post-title")
        )
    },
)

docs = loader.load()
```

**Loading Multiple URLs:**
```python
urls = [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3",
]

loader = WebBaseLoader(urls)
docs = loader.load()

print(f"Loaded {len(docs)} pages")
```

### 3. Web Page Loader (Playwright - JavaScript Support)

**Installation:**
```bash
pip install playwright
playwright install
```

**Loading JavaScript-Heavy Sites:**
```python
from langchain_community.document_loaders import PlaywrightURLLoader

# Playwright can execute JavaScript
loader = PlaywrightURLLoader(
    urls=["https://example.com"],
    remove_selectors=["header", "footer"],  # Remove unwanted elements
)

docs = loader.load()
```

### 4. Text File Loader

**Basic Text Loading:**
```python
from langchain_community.document_loaders import TextLoader

loader = TextLoader("path/to/file.txt")
docs = loader.load()

print(f"Content: {docs[0].page_content}")
print(f"Source: {docs[0].metadata['source']}")
```

**With Custom Encoding:**
```python
loader = TextLoader("file.txt", encoding="utf-8")
docs = loader.load()
```

### 5. Directory Loader (Batch Loading)

**Load Multiple Files:**
```python
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.document_loaders import TextLoader, PyPDFLoader

# Load all text files from a directory
loader = DirectoryLoader(
    "path/to/directory",
    glob="**/*.txt",  # Pattern for files to load
    loader_cls=TextLoader,
)

docs = loader.load()
print(f"Loaded {len(docs)} documents from directory")
```

**Multiple File Types:**
```python
import os
from langchain_community.document_loaders import (
    DirectoryLoader,
    TextLoader,
    PyPDFLoader,
)

# Custom loader based on file extension
def get_loader(file_path: str):
    if file_path.endswith(".pdf"):
        return PyPDFLoader(file_path)
    elif file_path.endswith(".txt"):
        return TextLoader(file_path)
    else:
        return TextLoader(file_path)

# Load all files
directory = "path/to/directory"
all_docs = []

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith((".pdf", ".txt", ".md")):
            file_path = os.path.join(root, file)
            loader = get_loader(file_path)
            docs = loader.load()
            all_docs.extend(docs)

print(f"Loaded {len(all_docs)} documents")
```

### 6. CSV Loader

**Basic CSV Loading:**
```python
from langchain_community.document_loaders.csv_loader import CSVLoader

loader = CSVLoader("path/to/data.csv")
docs = loader.load()

# Each row becomes a document
print(f"Loaded {len(docs)} rows")
print(f"First row: {docs[0].page_content}")
```

**Custom Column Handling:**
```python
loader = CSVLoader(
    file_path="data.csv",
    source_column="source",  # Column to use as source in metadata
)

docs = loader.load()
```

### 7. JSON Loader

**Basic JSON Loading:**
```python
from langchain_community.document_loaders import JSONLoader

# Load entire JSON
loader = JSONLoader(
    file_path="data.json",
    jq_schema=".",  # Load entire JSON
    text_content=False,
)

docs = loader.load()
```

**Extract Specific Fields:**
```python
# Use jq to extract specific fields
loader = JSONLoader(
    file_path="data.json",
    jq_schema=".messages[].content",  # Extract content field from messages array
    text_content=False,
)

docs = loader.load()
```

### 8. RecursiveCharacterTextSplitter (Most Important!)

**Installation:**
```bash
pip install langchain-text-splitters
```

**Basic Text Splitting:**
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Create splitter
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # Characters per chunk
    chunk_overlap=200,  # Overlap between chunks
    length_function=len,
    add_start_index=True,  # Track index in original document
)

# Split text
text = "Very long document text..."
chunks = splitter.split_text(text)

print(f"Split into {len(chunks)} chunks")
```

**Splitting Documents:**
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# 1. Load document
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# 2. Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True,
)

split_docs = splitter.split_documents(docs)

print(f"Original: {len(docs)} pages")
print(f"After splitting: {len(split_docs)} chunks")

# Each chunk maintains metadata from original
print(f"Chunk metadata: {split_docs[0].metadata}")
```

**How RecursiveCharacterTextSplitter Works:**
```python
# It tries to split on these separators in order:
# 1. "\n\n" (paragraphs)
# 2. "\n" (lines)
# 3. " " (words)
# 4. "" (characters)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=20,
    separators=["\n\n", "\n", " ", ""],  # Default
)

text = """
Paragraph 1 with some text.

Paragraph 2 with more text.

Paragraph 3 continues.
"""

chunks = splitter.split_text(text)
# Tries to keep paragraphs together first
```

### 9. CharacterTextSplitter (Simple)

**Basic Character Splitting:**
```python
from langchain_text_splitters import CharacterTextSplitter

splitter = CharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separator="\n",  # Split on newlines
)

chunks = splitter.split_text(text)
```

### 10. Token-Based Text Splitter

**Respect Token Limits:**
```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Split based on tokens (useful for LLM context limits)
splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=500,  # Token count
    chunk_overlap=50,
    encoding_name="cl100k_base",  # OpenAI's encoding
)

chunks = splitter.split_text(text)
print(f"Split into {len(chunks)} chunks by tokens")
```

### 11. Complete RAG Pipeline Example

**Full Document Processing Pipeline:**
```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# Step 1: Load documents
print("Loading PDF...")
loader = PyPDFLoader("document.pdf")
raw_docs = loader.load()
print(f"Loaded {len(raw_docs)} pages")

# Step 2: Split into chunks
print("Splitting documents...")
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True,
)
docs = splitter.split_documents(raw_docs)
print(f"Split into {len(docs)} chunks")

# Step 3: Create embeddings and vector store
print("Creating embeddings...")
embeddings = OpenAIEmbeddings()
vector_store = InMemoryVectorStore.from_documents(docs, embeddings)

# Step 4: Create retrieval chain
print("Setting up QA chain...")
llm = ChatOpenAI(model="gpt-4")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vector_store.as_retriever(search_kwargs={"k": 3}),
)

# Step 5: Ask questions
response = qa_chain.invoke({
    "query": "What are the main topics in this document?"
})

print("\nAnswer:", response["result"])
```

### 12. YouTube Transcript Loader

**Installation:**
```bash
pip install youtube-transcript-api
```

**Loading YouTube Transcripts:**
```python
from langchain_community.document_loaders import YoutubeLoader

loader = YoutubeLoader.from_youtube_url(
    "https://www.youtube.com/watch?v=VIDEO_ID",
    add_video_info=True,  # Include metadata
    language=["en"],
)

docs = loader.load()

print(f"Transcript: {docs[0].page_content}")
print(f"Video metadata: {docs[0].metadata}")
```

### 13. Notion Loader

**Installation:**
```bash
pip install notion-client
```

**Loading from Notion:**
```python
from langchain_community.document_loaders import NotionDBLoader

# Requires Notion API token
loader = NotionDBLoader(
    integration_token="your-notion-token",
    database_id="your-database-id",
)

docs = loader.load()
```

## Boundaries

### What You CAN Do

✅ Load documents from files, web, APIs, and databases
✅ Process PDFs, HTML, JSON, CSV, Markdown, and more
✅ Split large documents into smaller chunks
✅ Preserve metadata (source, page numbers, etc.)
✅ Batch load multiple files from directories
✅ Customize splitting strategies per use case
✅ Chain loaders with text splitters
✅ Filter and extract specific content from web pages
✅ Handle recursive directory structures
✅ Use async loading for better performance

### What You CANNOT Do

❌ Load documents without proper permissions/credentials
❌ Perfectly parse complex PDF layouts (tables, images)
❌ Extract text from images without OCR
❌ Load password-protected files without passwords
❌ Process binary files without appropriate loaders
❌ Guarantee perfect text extraction from all formats
❌ Automatically handle all character encodings
❌ Load infinitely large files (memory constraints)

## Gotchas

### 1. **PDF Quality Varies**
```python
# ⚠️ PDF extraction quality depends on PDF structure
loader = PyPDFLoader("document.pdf")
docs = loader.load()

# Some PDFs may have:
# - Poor text extraction (image-based PDFs)
# - Broken layouts (multi-column text)
# - Missing metadata

# ✅ Test with your specific PDFs
# ✅ Consider OCR for image-based PDFs
```

**Why it matters**: Not all PDFs are created equal. Test extraction quality with your specific documents.

### 2. **Chunk Size Matters**
```python
# ❌ TOO LARGE: Poor retrieval precision
large_splitter = RecursiveCharacterTextSplitter(
    chunk_size=5000,  # Too big
    chunk_overlap=500,
)

# ❌ TOO SMALL: Loses context
small_splitter = RecursiveCharacterTextSplitter(
    chunk_size=100,  # Too small
    chunk_overlap=10,
)

# ✅ GOOD: Balance context and precision
good_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # Good default
    chunk_overlap=200,  # 20% overlap
)
```

**Why it matters**: Chunk size affects retrieval quality. Too large = poor precision, too small = lost context.

### 3. **Chunk Overlap Is Important**
```python
# ❌ BAD: No overlap
no_overlap = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=0,  # Might split important context!
)

# ✅ GOOD: 10-20% overlap
with_overlap = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,  # Preserves context across boundaries
)
```

**Why it matters**: Overlap prevents important information from being split across chunks.

### 4. **Web Scraping Rate Limits**
```python
import time

# ❌ BAD: Rapid-fire requests
urls = [...]  # 1000 URLs
for url in urls:
    loader = WebBaseLoader(url)
    docs = loader.load()  # Will get rate limited!

# ✅ GOOD: Add delays
for url in urls:
    loader = WebBaseLoader(url)
    docs = loader.load()
    time.sleep(1)  # 1 second delay
```

**Why it matters**: Respect website rate limits to avoid being blocked.

### 5. **Metadata Preservation**
```python
from langchain_core.documents import Document

# Documents maintain metadata through splitting
loader = PyPDFLoader("doc.pdf")
docs = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks = splitter.split_documents(docs)

# ✅ Each chunk maintains original metadata
for chunk in chunks:
    print(chunk.metadata["source"])  # Original PDF path
    print(chunk.metadata["page"])  # Original page number
```

**Why it matters**: Metadata is essential for citations and source tracking.

### 6. **Directory Loader Patterns**
```python
from langchain_community.document_loaders import DirectoryLoader

# ✅ Use glob patterns to filter files
loader = DirectoryLoader(
    "docs",
    glob="**/*.txt",  # Recursive, only .txt files
    loader_cls=TextLoader,
)

# ⚠️ Unmatched files are skipped silently!
docs = loader.load()
```

**Why it matters**: Only files matching the glob pattern are loaded.

### 7. **Character Encoding Issues**
```python
# Some files may have encoding issues
from langchain_community.document_loaders import TextLoader

try:
    loader = TextLoader("file.txt", encoding="utf-8")
    docs = loader.load()
except UnicodeDecodeError:
    # Try different encoding
    loader = TextLoader("file.txt", encoding="latin-1")
    docs = loader.load()
```

**Why it matters**: Non-UTF-8 files may cause loading errors. Handle encoding explicitly when needed.

### 8. **Memory Constraints**
```python
# ❌ BAD: Loading massive files into memory
loader = PyPDFLoader("huge-500page-document.pdf")
docs = loader.load()  # Might crash!

# ✅ BETTER: Process in batches
loader = PyPDFLoader("huge-document.pdf")
docs = loader.load()

# Process in batches
batch_size = 10
for i in range(0, len(docs), batch_size):
    batch = docs[i:i + batch_size]
    # Process batch
```

**Why it matters**: Large documents can exhaust memory. Process incrementally when possible.

### 9. **Async Loading**
```python
import asyncio
from langchain_community.document_loaders import WebBaseLoader

# ✅ Use async for better performance
async def load_urls_async(urls):
    loader = WebBaseLoader(urls)
    docs = await loader.aload()
    return docs

urls = ["url1", "url2", "url3"]
docs = asyncio.run(load_urls_async(urls))
```

**Why it matters**: Async loading is faster for multiple URLs.

### 10. **Text Splitter Separators**
```python
# RecursiveCharacterTextSplitter tries separators in order
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", " ", ""],  # Order matters!
)

# It tries:
# 1. Split on double newlines (paragraphs) first
# 2. If chunks still too large, split on single newlines
# 3. If still too large, split on spaces
# 4. Last resort: split on characters

# ✅ Customize separators for your content
code_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\nclass ", "\n\ndef ", "\n\n", "\n", " ", ""],
    # Tries to keep functions/classes together
)
```

**Why it matters**: Separator order affects how naturally text is split.

## Links to Full Documentation

- **Document Loaders Overview**: https://python.langchain.com/docs/integrations/document_loaders/
- **PDF Loaders**: https://python.langchain.com/docs/integrations/document_loaders/pdf
- **Web Loaders**: https://python.langchain.com/docs/integrations/document_loaders/web_base
- **Text Splitters**: https://python.langchain.com/docs/integrations/text_splitters/
- **RecursiveCharacterTextSplitter**: https://python.langchain.com/docs/integrations/text_splitters/recursive_character
- **All Document Loaders**: https://python.langchain.com/docs/integrations/document_loaders/
- **RAG Tutorial**: https://python.langchain.com/docs/tutorials/rag
