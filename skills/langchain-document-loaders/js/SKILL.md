---
name: langchain-document-loaders
description: Guide to loading and processing documents in LangChain, including PDF loaders, web scrapers, text splitters (RecursiveCharacterTextSplitter), and various file format loaders for RAG pipelines.
language: js
---

# langchain-document-loaders (JavaScript/TypeScript)

---
name: langchain-document-loaders
description: Guide to loading and processing documents in LangChain, including PDF loaders, web scrapers, text splitters (RecursiveCharacterTextSplitter), and various file format loaders for RAG pipelines.
language: js
---

# LangChain Document Loaders (JavaScript/TypeScript)

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
| PDF files | `PDFLoader` | Extract text from PDF documents |
| Web pages | `CheerioWebBaseLoader` or `PlaywrightWebBaseLoader` | Scrape web content |
| JavaScript-heavy sites | `PlaywrightWebBaseLoader` | Sites requiring JS rendering |
| Text files | `TextLoader` | Plain text documents |
| JSON | `JSONLoader` | Structured JSON data |
| CSV | `CSVLoader` | Tabular data |
| Markdown | `TextLoader` or `UnstructuredLoader` | Markdown documents |
| Microsoft Word | `DocxLoader` | .docx files |
| Directory of files | `DirectoryLoader` | Batch load multiple files |
| YouTube videos | `YoutubeLoader` | Video transcripts |
| Google Drive | `GoogleDriveLoader` | Cloud documents |
| Notion | `NotionLoader` | Notion pages and databases |

### Which Text Splitter Should I Use?

| Splitter | Best For | Why |
|----------|----------|-----|
| `RecursiveCharacterTextSplitter` | General text | Most versatile, preserves structure |
| `CharacterTextSplitter` | Simple splitting | Fast, basic character-based |
| `TokenTextSplitter` | LLM context windows | Respects token limits |
| `MarkdownTextSplitter` | Markdown docs | Preserves markdown structure |
| `CodeTextSplitter` | Source code | Language-aware splitting |

## Code Examples

### 1. PDF Document Loader

**Installation:**
```bash
npm install pdf-parse
```

**Basic PDF Loading:**
```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Load a PDF file
const loader = new PDFLoader("path/to/document.pdf");

// Load returns array of Document objects (one per page)
const docs = await loader.load();

console.log(`Loaded ${docs.length} pages`);
console.log("First page:", docs[0].pageContent.substring(0, 200));
console.log("Metadata:", docs[0].metadata);
```

**Loading with Options:**
```typescript
const loader = new PDFLoader("document.pdf", {
  splitPages: true, // One document per page (default)
  // splitPages: false, // Single document for entire PDF
});

const docs = await loader.load();
```

### 2. Web Page Loader (Cheerio)

**Installation:**
```bash
npm install cheerio
```

**Basic Web Scraping:**
```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

// Load a web page
const loader = new CheerioWebBaseLoader(
  "https://js.langchain.com/docs/introduction/"
);

const docs = await loader.load();

console.log("Page content:", docs[0].pageContent.substring(0, 500));
console.log("Source:", docs[0].metadata.source);
```

**Filtering Specific Content:**
```typescript
// Load only specific elements
const loader = new CheerioWebBaseLoader(
  "https://example.com/blog",
  {
    selector: ".post-content", // CSS selector for content
  }
);

const docs = await loader.load();
```

**Custom Parsing:**
```typescript
const loader = new CheerioWebBaseLoader(
  "https://example.com",
  {
    selector: "article",
  }
);

const docs = await loader.load();
```

### 3. Web Page Loader (Playwright - JavaScript Support)

**Installation:**
```bash
npm install playwright
```

**Loading JavaScript-Heavy Sites:**
```typescript
import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";

// Playwright can execute JavaScript
const loader = new PlaywrightWebBaseLoader("https://example.com", {
  launchOptions: {
    headless: true,
  },
  gotoOptions: {
    waitUntil: "domcontentloaded",
  },
  evaluateOptions: {
    // Optional: evaluate custom JS in page context
    evaluate: async (page, browser) => {
      // Wait for dynamic content
      await page.waitForSelector(".content");
      return page.content();
    },
  },
});

const docs = await loader.load();
```

### 4. Text File Loader

**Basic Text Loading:**
```typescript
import { TextLoader } from "langchain/document_loaders/fs/text";

const loader = new TextLoader("path/to/file.txt");
const docs = await loader.load();

console.log("Content:", docs[0].pageContent);
console.log("Source:", docs[0].metadata.source);
```

### 5. Directory Loader (Batch Loading)

**Load Multiple Files:**
```typescript
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Load all files from a directory
const loader = new DirectoryLoader(
  "path/to/directory",
  {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
    ".md": (path) => new TextLoader(path),
  }
);

const docs = await loader.load();
console.log(`Loaded ${docs.length} documents from directory`);
```

**Recursive Directory Loading:**
```typescript
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";

const loader = new DirectoryLoader(
  "path/to/directory",
  {
    ".txt": (path) => new TextLoader(path),
  },
  true // Recursive
);

const docs = await loader.load();
```

### 6. CSV Loader

**Installation:**
```bash
npm install csv-parse
```

**Basic CSV Loading:**
```typescript
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

const loader = new CSVLoader("path/to/data.csv");
const docs = await loader.load();

// Each row becomes a document
console.log(`Loaded ${docs.length} rows`);
console.log("First row:", docs[0].pageContent);
```

**Custom Column Handling:**
```typescript
const loader = new CSVLoader("data.csv", {
  column: "content", // Use specific column as page content
  separator: ",",
});

const docs = await loader.load();
```

### 7. JSON Loader

**Basic JSON Loading:**
```typescript
import { JSONLoader } from "langchain/document_loaders/fs/json";

const loader = new JSONLoader("path/to/data.json");
const docs = await loader.load();
```

**Extract Specific Fields:**
```typescript
const loader = new JSONLoader(
  "data.json",
  ["/content"], // JSON pointer to extract
);

const docs = await loader.load();
```

### 8. RecursiveCharacterTextSplitter (Most Important!)

**Installation:**
```bash
npm install @langchain/textsplitters
```

**Basic Text Splitting:**
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Create splitter
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Characters per chunk
  chunkOverlap: 200, // Overlap between chunks
});

// Split text
const text = "Very long document text...";
const chunks = await splitter.splitText(text);

console.log(`Split into ${chunks.length} chunks`);
```

**Splitting Documents:**
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// 1. Load document
const loader = new PDFLoader("document.pdf");
const docs = await loader.load();

// 2. Split into chunks
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const splitDocs = await splitter.splitDocuments(docs);

console.log(`Original: ${docs.length} pages`);
console.log(`After splitting: ${splitDocs.length} chunks`);

// Each chunk maintains metadata from original
console.log("Chunk metadata:", splitDocs[0].metadata);
```

**How RecursiveCharacterTextSplitter Works:**
```typescript
// It tries to split on these separators in order:
// 1. "\n\n" (paragraphs)
// 2. "\n" (lines)
// 3. " " (words)
// 4. "" (characters)

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 20,
  separators: ["\n\n", "\n", " ", ""], // Default
});

const text = `
Paragraph 1 with some text.

Paragraph 2 with more text.

Paragraph 3 continues.
`;

const chunks = await splitter.splitText(text);
// Tries to keep paragraphs together first
```

### 9. CharacterTextSplitter (Simple)

**Basic Character Splitting:**
```typescript
import { CharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new CharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separator: "\n", // Split on newlines
});

const chunks = await splitter.splitText(text);
```

### 10. Token-Based Text Splitter

**Respect Token Limits:**
```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Split based on tokens (useful for LLM context limits)
const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 500, // Approximate token count
  chunkOverlap: 50,
});

const chunks = await splitter.splitText(markdownText);
```

### 11. Complete RAG Pipeline Example

**Full Document Processing Pipeline:**
```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/core/vectorstores";
import { ChatOpenAI } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";

// Step 1: Load documents
console.log("Loading PDF...");
const loader = new PDFLoader("document.pdf");
const rawDocs = await loader.load();
console.log(`Loaded ${rawDocs.length} pages`);

// Step 2: Split into chunks
console.log("Splitting documents...");
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await splitter.splitDocuments(rawDocs);
console.log(`Split into ${docs.length} chunks`);

// Step 3: Create embeddings and vector store
console.log("Creating embeddings...");
const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

// Step 4: Create retrieval chain
console.log("Setting up QA chain...");
const model = new ChatOpenAI({ model: "gpt-4" });
const chain = RetrievalQAChain.fromLLM(
  model,
  vectorStore.asRetriever({ k: 3 })
);

// Step 5: Ask questions
const response = await chain.invoke({
  query: "What are the main topics in this document?",
});

console.log("\nAnswer:", response.text);
```

### 12. YouTube Transcript Loader

**Installation:**
```bash
npm install youtube-transcript
```

**Loading YouTube Transcripts:**
```typescript
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

const loader = YoutubeLoader.createFromUrl("https://www.youtube.com/watch?v=VIDEO_ID", {
  language: "en",
  addVideoInfo: true, // Include metadata
});

const docs = await loader.load();

console.log("Transcript:", docs[0].pageContent);
console.log("Video metadata:", docs[0].metadata);
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
```typescript
// ⚠️ PDF extraction quality depends on PDF structure
const loader = new PDFLoader("document.pdf");
const docs = await loader.load();

// Some PDFs may have:
// - Poor text extraction (image-based PDFs)
// - Broken layouts (multi-column text)
// - Missing metadata

// ✅ Test with your specific PDFs
// ✅ Consider OCR for image-based PDFs
```

**Why it matters**: Not all PDFs are created equal. Test extraction quality with your specific documents.

### 2. **Chunk Size Matters**
```typescript
// ❌ TOO LARGE: Poor retrieval precision
const largeSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 5000, // Too big
  chunkOverlap: 500,
});

// ❌ TOO SMALL: Loses context
const smallSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100, // Too small
  chunkOverlap: 10,
});

// ✅ GOOD: Balance context and precision
const goodSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Good default
  chunkOverlap: 200, // 20% overlap
});
```

**Why it matters**: Chunk size affects retrieval quality. Too large = poor precision, too small = lost context.

### 3. **Chunk Overlap Is Important**
```typescript
// ❌ BAD: No overlap
const noOverlap = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0, // Might split important context!
});

// ✅ GOOD: 10-20% overlap
const withOverlap = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200, // Preserves context across boundaries
});
```

**Why it matters**: Overlap prevents important information from being split across chunks.

### 4. **Web Scraping Rate Limits**
```typescript
// ❌ BAD: Rapid-fire requests
const urls = [...]; // 1000 URLs
for (const url of urls) {
  const loader = new CheerioWebBaseLoader(url);
  await loader.load(); // Will get rate limited!
}

// ✅ GOOD: Add delays
for (const url of urls) {
  const loader = new CheerioWebBaseLoader(url);
  await loader.load();
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
}
```

**Why it matters**: Respect website rate limits to avoid being blocked.

### 5. **Metadata Preservation**
```typescript
import { Document } from "@langchain/core/documents";

// Documents maintain metadata through splitting
const loader = new PDFLoader("doc.pdf");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

// ✅ Each chunk maintains original metadata
chunks.forEach((chunk) => {
  console.log(chunk.metadata.source); // Original PDF path
  console.log(chunk.metadata.page); // Original page number
});
```

**Why it matters**: Metadata is essential for citations and source tracking.

### 6. **Directory Loader File Types**
```typescript
// ✅ Explicitly map file extensions to loaders
const loader = new DirectoryLoader(
  "docs",
  {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
    ".md": (path) => new TextLoader(path),
    // Add all types you need
  }
);

// ⚠️ Unmapped file types are skipped silently!
```

**Why it matters**: Files without mapped loaders are silently ignored.

### 7. **Character Encoding Issues**
```typescript
// Some files may have encoding issues
import { TextLoader } from "langchain/document_loaders/fs/text";

try {
  const loader = new TextLoader("file.txt");
  const docs = await loader.load();
} catch (error) {
  console.error("Encoding error:", error);
  // Try specifying encoding or pre-processing file
}
```

**Why it matters**: Non-UTF-8 files may cause loading errors. Handle encoding explicitly when needed.

### 8. **Memory Constraints**
```typescript
// ❌ BAD: Loading massive files into memory
const loader = new PDFLoader("huge-500page-document.pdf");
const docs = await loader.load(); // Might crash!

// ✅ BETTER: Process in batches or stream if possible
// Load, split, and process incrementally
const loader = new PDFLoader("huge-document.pdf", {
  splitPages: true,
});

const docs = await loader.load();

// Process in batches
const batchSize = 10;
for (let i = 0; i < docs.length; i += batchSize) {
  const batch = docs.slice(i, i + batchSize);
  // Process batch
}
```

**Why it matters**: Large documents can exhaust memory. Process incrementally when possible.

### 9. **Async Loading**
```typescript
// ✅ All loaders are async
const loader = new PDFLoader("doc.pdf");

// Don't forget await!
const docs = await loader.load();

// ❌ BAD: Forgetting await
const docs = loader.load(); // Returns Promise!
console.log(docs); // Promise { <pending> }
```

**Why it matters**: Forgetting `await` is a common mistake with loaders.

### 10. **Text Splitter Separators**
```typescript
// RecursiveCharacterTextSplitter tries separators in order
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""], // Order matters!
});

// It tries:
// 1. Split on double newlines (paragraphs) first
// 2. If chunks still too large, split on single newlines
// 3. If still too large, split on spaces
// 4. Last resort: split on characters

// ✅ Customize separators for your content
const codeSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 100,
  separators: ["\n\nclass ", "\n\nfunction ", "\n\n", "\n", " ", ""],
  // Tries to keep functions/classes together
});
```

**Why it matters**: Separator order affects how naturally text is split.

## Links to Full Documentation

- **Document Loaders Overview**: https://js.langchain.com/docs/integrations/document_loaders/
- **PDF Loader**: https://js.langchain.com/docs/integrations/document_loaders/file_loaders/pdf
- **Web Loaders**: https://js.langchain.com/docs/integrations/document_loaders/web_loaders/
- **Text Splitters**: https://js.langchain.com/docs/integrations/text_splitters/
- **RecursiveCharacterTextSplitter**: https://js.langchain.com/docs/integrations/text_splitters/recursive_character
- **All Document Loaders**: https://js.langchain.com/docs/integrations/document_loaders/
- **RAG Tutorial**: https://js.langchain.com/docs/tutorials/rag
