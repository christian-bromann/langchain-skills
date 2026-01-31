---
name: langchain-document-loading
description: Guide to loading documents from various sources (PDFs, web pages, text files) using LangChain document loaders. Covers common loaders, document structure, metadata handling, and best practices for RAG applications.
language: python
---

# langchain-document-loading (Python)

---
name: langchain-document-loading
description: Guide to loading documents from various sources (PDFs, web pages, text files) using LangChain document loaders. Covers common loaders, document structure, metadata handling, and best practices for RAG applications.
language: python
---

# Document Loading with LangChain (Python)

## Overview

Document loaders are objects that load data from various sources and return a list of `Document` objects. This is the first step in building RAG applications and knowledge bases.

### Document Structure

Each `Document` has three attributes:
- `page_content`: String containing the content
- `metadata`: Dict containing arbitrary metadata (source, page number, etc.)
- `id`: Optional string identifier

```python
from langchain_core.documents import Document

doc = Document(
    page_content="LangChain is a framework for building AI applications.",
    metadata={"source": "intro.txt", "page": 1},
    id="doc_001"
)
```

## Common Document Loaders

| Loader | Use Case | Package |
|--------|----------|---------|
| `PyPDFLoader` | PDF files | `langchain_community` |
| `WebBaseLoader` | Web pages | `langchain_community` |
| `TextLoader` | Plain text files | `langchain_community` |
| `CSVLoader` | CSV files | `langchain_community` |
| `UnstructuredLoader` | Multiple formats | `unstructured` |
| `DirectoryLoader` | Batch load from folder | `langchain_community` |

## Loading PDFs

### Basic PDF Loading

```python
from langchain_community.document_loaders import PyPDFLoader

# Load PDF - creates one Document per page
loader = PyPDFLoader("path/to/document.pdf")
docs = loader.load()

print(f"Loaded {len(docs)} pages")
print(f"First page content: {docs[0].page_content[:200]}")
print(f"Metadata: {docs[0].metadata}")
```

### Advanced PDF Options

```python
# PyPDFLoader with page numbers
loader = PyPDFLoader("financial_report.pdf")
pages = loader.load()

for i, page in enumerate(pages):
    print(f"Page {i+1}:")
    print(f"  Source: {page.metadata['source']}")
    print(f"  Page: {page.metadata['page']}")
    print(f"  Length: {len(page.page_content)} chars\n")
```

### Alternative PDF Loaders

```python
# PDFMiner - better text extraction
from langchain_community.document_loaders import PDFMinerLoader
loader = PDFMinerLoader("document.pdf")
docs = loader.load()

# PyMuPDF - faster processing
from langchain_community.document_loaders import PyMuPDFLoader
loader = PyMuPDFLoader("document.pdf")
docs = loader.load()

# UnstructuredPDFLoader - handles complex layouts
from langchain_community.document_loaders import UnstructuredPDFLoader
loader = UnstructuredPDFLoader("document.pdf")
docs = loader.load()
```

## Loading Web Pages

### Basic Web Loading

```python
from langchain_community.document_loaders import WebBaseLoader

# Load single web page
loader = WebBaseLoader("https://example.com/article")
docs = loader.load()

print(f"Page title: {docs[0].metadata.get('title')}")
print(f"Content length: {len(docs[0].page_content)}")
```

### Custom Web Scraping

```python
from langchain_community.document_loaders import WebBaseLoader
from bs4 import BeautifulSoup

# Custom parsing with BeautifulSoup
loader = WebBaseLoader(
    web_paths=["https://blog.example.com/post"],
    bs_kwargs={
        "parse_only": BeautifulSoup.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )
    }
)
docs = loader.load()
```

### Multiple URLs

```python
urls = [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3",
]

# Load all URLs
docs = [WebBaseLoader(url).load() for url in urls]
docs_list = [item for sublist in docs for item in sublist]

print(f"Loaded {len(docs_list)} documents from {len(urls)} URLs")
```

## Loading Text Files

### Single Text File

```python
from langchain_community.document_loaders import TextLoader

# Load text file
loader = TextLoader("path/to/file.txt", encoding="utf-8")
docs = loader.load()

print(docs[0].page_content)
```

### Directory of Files

```python
from langchain_community.document_loaders import DirectoryLoader, TextLoader

# Load all .txt files from directory
loader = DirectoryLoader(
    "path/to/directory",
    glob="**/*.txt",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"}
)
docs = loader.load()

print(f"Loaded {len(docs)} text files")
```

### CSV Files

```python
from langchain_community.document_loaders import CSVLoader

# Load CSV with custom delimiter
loader = CSVLoader(
    file_path="data.csv",
    csv_args={
        "delimiter": ",",
        "quotechar": '"',
        "fieldnames": ["id", "text", "category"]
    }
)
docs = loader.load()
```

## Document Metadata

### Accessing Metadata

```python
loader = PyPDFLoader("report.pdf")
docs = loader.load()

# Access metadata
for doc in docs:
    print(f"Source: {doc.metadata['source']}")
    print(f"Page: {doc.metadata['page']}")
    print(f"Content length: {len(doc.page_content)}\n")
```

### Adding Custom Metadata

```python
from langchain_core.documents import Document

# Create document with custom metadata
doc = Document(
    page_content="Important business data",
    metadata={
        "source": "quarterly_report.pdf",
        "department": "finance",
        "date": "2024-Q1",
        "classification": "confidential"
    }
)

# Add metadata to loaded documents
docs = loader.load()
for doc in docs:
    doc.metadata["loaded_at"] = "2024-01-15"
    doc.metadata["version"] = "1.0"
```

## Specialized Loaders

### JSON Files

```python
from langchain_community.document_loaders import JSONLoader

# Load JSON with jq schema
loader = JSONLoader(
    file_path="data.json",
    jq_schema=".messages[].content",
    text_content=False
)
docs = loader.load()
```

### Notion Pages

```python
from langchain_community.document_loaders import NotionDirectoryLoader

# Load exported Notion pages
loader = NotionDirectoryLoader("path/to/notion_export")
docs = loader.load()
```

### GitHub Repository

```python
from langchain_community.document_loaders import GithubFileLoader

# Load files from GitHub
loader = GithubFileLoader(
    repo="langchain-ai/langchain",
    access_token="your_token",
    github_api_url="https://api.github.com",
    file_filter=lambda file_path: file_path.endswith(".py")
)
docs = loader.load()
```

## Decision Table: Choosing a Loader

| Source Type | Loader | When to Use |
|-------------|--------|-------------|
| PDF (simple) | `PyPDFLoader` | Standard PDFs, need page numbers |
| PDF (complex) | `UnstructuredPDFLoader` | Tables, images, complex layouts |
| Web page | `WebBaseLoader` | Blog posts, articles, documentation |
| Text files | `TextLoader` | Plain text, markdown, code files |
| CSV/Excel | `CSVLoader`, `UnstructuredExcelLoader` | Tabular data |
| Multiple files | `DirectoryLoader` | Batch load entire directory |
| JSON | `JSONLoader` | Structured data, API responses |

## Best Practices

### 1. Handle Encoding

```python
# Specify encoding explicitly
loader = TextLoader("file.txt", encoding="utf-8")

# Handle encoding errors
loader = TextLoader(
    "file.txt",
    encoding="utf-8",
    autodetect_encoding=True
)
```

### 2. Filter Content

```python
# Only load specific sections
loader = WebBaseLoader(
    "https://example.com",
    bs_kwargs={
        "parse_only": BeautifulSoup.SoupStrainer(class_="main-content")
    }
)
```

### 3. Batch Loading

```python
# Load multiple files efficiently
from langchain_community.document_loaders import DirectoryLoader

loader = DirectoryLoader(
    "./docs",
    glob="**/*.pdf",
    loader_cls=PyPDFLoader,
    show_progress=True,
    use_multithreading=True
)
docs = loader.load()
```

### 4. Error Handling

```python
from pathlib import Path

def safe_load_documents(file_path: str):
    """Safely load documents with error handling."""
    try:
        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine loader based on extension
        if file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith('.txt'):
            loader = TextLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_path}")
        
        docs = loader.load()
        print(f"Successfully loaded {len(docs)} documents")
        return docs
    
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

docs = safe_load_documents("report.pdf")
```

## Explicit Boundaries

### ✅ Agents CAN:
- Load documents from PDFs, web pages, text files, and more
- Access and modify document metadata
- Load multiple files from directories
- Handle different file encodings
- Parse HTML with custom selectors
- Load remote content from URLs
- Batch process large document sets

### ❌ Agents CANNOT:
- Load documents without proper credentials/access
- Automatically fix corrupted files
- Load password-protected PDFs without password
- Parse heavily obfuscated content
- Access documents behind authentication without tokens
- Load files larger than memory (need streaming)

## Gotchas

1. **Page vs Document**: PDF loaders create one Document per page
   ```python
   # Each page is separate
   loader = PyPDFLoader("10_page_doc.pdf")
   docs = loader.load()  # Returns 10 Documents
   ```

2. **Web Content Cleanup**: Web pages include navigation, ads, etc.
   ```python
   # Filter to main content only
   bs_kwargs={"parse_only": BeautifulSoup.SoupStrainer(class_="article")}
   ```

3. **File Encoding**: Default encoding may fail
   ```python
   # Always specify encoding
   loader = TextLoader("file.txt", encoding="utf-8")
   ```

4. **Metadata Preservation**: Add metadata before splitting
   ```python
   for doc in docs:
       doc.metadata["source_file"] = filename
       doc.metadata["loaded_at"] = datetime.now()
   ```

5. **Memory Usage**: Large files can exceed memory
   ```python
   # Use lazy loading for large files
   loader = PyPDFLoader("large.pdf")
   for page in loader.lazy_load():
       process_page(page)
   ```

## Full Documentation

- [Document Loaders Overview](https://docs.langchain.com/oss/python/integrations/document_loaders/index)
- [PDF Loaders](https://docs.langchain.com/oss/python/integrations/document_loaders/index#pdfs)
- [Web Loaders](https://docs.langchain.com/oss/python/integrations/document_loaders/index#webpages)
- [Document Interface](https://docs.langchain.com/oss/python/langchain/knowledge-base#documents-and-document-loaders)
