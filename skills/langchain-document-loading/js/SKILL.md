---
name: langchain-document-loading
description: Guide to loading documents from various sources (PDFs, web pages, text files) using LangChain document loaders. Covers common loaders, document structure, metadata handling, and best practices for RAG applications.
language: js
---

# langchain-document-loading (JavaScript/TypeScript)

---
name: langchain-document-loading
description: Guide to loading documents from various sources (PDFs, web pages, text files) using LangChain document loaders. Covers common loaders, document structure, metadata handling, and best practices for RAG applications.
language: js
---

# Document Loading with LangChain (JavaScript/TypeScript)

## Overview

Document loaders are objects that load data from various sources and return a list of `Document` objects. This is the first step in building RAG applications and knowledge bases.

### Document Structure

Each `Document` has three attributes:
- `pageContent`: String containing the content
- `metadata`: Object containing arbitrary metadata (source, page number, etc.)
- `id`: Optional string identifier

```typescript
import { Document } from "@langchain/core/documents";

const doc = new Document({
  pageContent: "LangChain is a framework for building AI applications.",
  metadata: { source: "intro.txt", page: 1 },
  id: "doc_001"
});
```

## Common Document Loaders

| Loader | Use Case | Package |
|--------|----------|---------|
| `PDFLoader` | PDF files | `@langchain/community` |
| `CheerioWebBaseLoader` | Web pages | `@langchain/community` |
| `TextLoader` | Plain text files | `@langchain/community` |
| `CSVLoader` | CSV files | `@langchain/community` |
| `UnstructuredLoader` | Multiple formats | `@langchain/community` |
| `DirectoryLoader` | Batch load from folder | `@langchain/community` |

## Loading PDFs

### Basic PDF Loading

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// Load PDF - creates one Document per page
const loader = new PDFLoader("path/to/document.pdf");
const docs = await loader.load();

console.log(`Loaded ${docs.length} pages`);
console.log(`First page: ${docs[0].pageContent.slice(0, 200)}`);
console.log(`Metadata:`, docs[0].metadata);
```

### Advanced PDF Options

```typescript
// PDFLoader with options
const loader = new PDFLoader("financial_report.pdf", {
  splitPages: true,  // One doc per page
  parsedItemSeparator: "\n"
});
const pages = await loader.load();

pages.forEach((page, i) => {
  console.log(`Page ${i + 1}:`);
  console.log(`  Source: ${page.metadata.source}`);
  console.log(`  Page: ${page.metadata.loc?.pageNumber}`);
  console.log(`  Length: ${page.pageContent.length} chars\n`);
});
```

### Web-based PDF Loading

```typescript
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

// Load PDF from URL (browser environment)
const loader = new WebPDFLoader("https://example.com/document.pdf");
const docs = await loader.load();
```

## Loading Web Pages

### Basic Web Loading (Cheerio)

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

// Load single web page
const loader = new CheerioWebBaseLoader("https://example.com/article");
const docs = await loader.load();

console.log(`Page title: ${docs[0].metadata.title}`);
console.log(`Content length: ${docs[0].pageContent.length}`);
```

### Custom Web Scraping

```typescript
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

// Custom selector for specific content
const loader = new CheerioWebBaseLoader(
  "https://blog.example.com/post",
  {
    selector: ".post-content, .post-title, .post-header"
  }
);
const docs = await loader.load();
```

### Multiple URLs

```typescript
const urls = [
  "https://example.com/page1",
  "https://example.com/page2",
  "https://example.com/page3",
];

// Load all URLs
const loaders = urls.map(url => new CheerioWebBaseLoader(url));
const docsArrays = await Promise.all(loaders.map(loader => loader.load()));
const docsList = docsArrays.flat();

console.log(`Loaded ${docsList.length} documents from ${urls.length} URLs`);
```

### Playwright for Dynamic Content

```typescript
import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";

// Load JavaScript-rendered content
const loader = new PlaywrightWebBaseLoader("https://example.com", {
  launchOptions: {
    headless: true
  },
  gotoOptions: {
    waitUntil: "domcontentloaded"
  },
  evaluate: async (page) => {
    // Wait for content to load
    await page.waitForSelector(".content");
    return page.content();
  }
});
const docs = await loader.load();
```

## Loading Text Files

### Single Text File

```typescript
import { TextLoader } from "@langchain/community/document_loaders/fs/text";

// Load text file
const loader = new TextLoader("path/to/file.txt");
const docs = await loader.load();

console.log(docs[0].pageContent);
```

### Directory of Files

```typescript
import { DirectoryLoader } from "@langchain/community/document_loaders/fs/directory";
import { TextLoader } from "@langchain/community/document_loaders/fs/text";

// Load all .txt files from directory
const loader = new DirectoryLoader(
  "path/to/directory",
  {
    ".txt": (path) => new TextLoader(path),
  }
);
const docs = await loader.load();

console.log(`Loaded ${docs.length} text files`);
```

### CSV Files

```typescript
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";

// Load CSV file
const loader = new CSVLoader("data.csv", {
  column: "text",  // Column to use as content
  separator: ","
});
const docs = await loader.load();
```

## Document Metadata

### Accessing Metadata

```typescript
const loader = new PDFLoader("report.pdf");
const docs = await loader.load();

// Access metadata
docs.forEach(doc => {
  console.log(`Source: ${doc.metadata.source}`);
  console.log(`Page: ${doc.metadata.loc?.pageNumber}`);
  console.log(`Content length: ${doc.pageContent.length}\n`);
});
```

### Adding Custom Metadata

```typescript
import { Document } from "@langchain/core/documents";

// Create document with custom metadata
const doc = new Document({
  pageContent: "Important business data",
  metadata: {
    source: "quarterly_report.pdf",
    department: "finance",
    date: "2024-Q1",
    classification: "confidential"
  }
});

// Add metadata to loaded documents
const docs = await loader.load();
docs.forEach(doc => {
  doc.metadata.loadedAt = "2024-01-15";
  doc.metadata.version = "1.0";
});
```

## Specialized Loaders

### JSON Files

```typescript
import { JSONLoader } from "@langchain/community/document_loaders/fs/json";

// Load JSON file
const loader = new JSONLoader(
  "data.json",
  "/messages/*/content"  // JSONPath to extract content
);
const docs = await loader.load();
```

### Notion Pages

```typescript
import { NotionAPILoader } from "@langchain/community/document_loaders/web/notionapi";

// Load from Notion API
const loader = new NotionAPILoader({
  clientOptions: {
    auth: process.env.NOTION_API_KEY
  },
  id: "page_id_here",
  type: "page"
});
const docs = await loader.load();
```

### GitHub Repository

```typescript
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

// Load files from GitHub
const loader = new GithubRepoLoader(
  "https://github.com/langchain-ai/langchainjs",
  {
    branch: "main",
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5
  }
);
const docs = await loader.load();
```

## Decision Table: Choosing a Loader

| Source Type | Loader | When to Use |
|-------------|--------|-------------|
| PDF (Node.js) | `PDFLoader` | Server-side PDF processing |
| PDF (Browser) | `WebPDFLoader` | Client-side PDF processing |
| Web (static) | `CheerioWebBaseLoader` | Fast, server-side scraping |
| Web (dynamic) | `PlaywrightWebBaseLoader` | JavaScript-rendered content |
| Text files | `TextLoader` | Plain text, markdown, code |
| CSV | `CSVLoader` | Tabular data |
| Multiple files | `DirectoryLoader` | Batch load entire directory |
| JSON | `JSONLoader` | Structured data, API responses |

## Best Practices

### 1. Handle Errors

```typescript
async function safeLoadDocuments(filePath: string) {
  try {
    let loader;
    
    if (filePath.endsWith('.pdf')) {
      loader = new PDFLoader(filePath);
    } else if (filePath.endsWith('.txt')) {
      loader = new TextLoader(filePath);
    } else {
      throw new Error(`Unsupported file type: ${filePath}`);
    }
    
    const docs = await loader.load();
    console.log(`Successfully loaded ${docs.length} documents`);
    return docs;
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return [];
  }
}
```

### 2. Filter Content

```typescript
// Only load specific sections
const loader = new CheerioWebBaseLoader(
  "https://example.com",
  { selector: ".main-content" }
);
```

### 3. Batch Loading

```typescript
// Load multiple files efficiently
const loader = new DirectoryLoader(
  "./docs",
  {
    ".pdf": (path) => new PDFLoader(path),
    ".txt": (path) => new TextLoader(path),
    ".csv": (path) => new CSVLoader(path)
  }
);
const docs = await loader.load();
console.log(`Loaded ${docs.length} documents`);
```

### 4. Concurrent Loading

```typescript
// Load multiple URLs concurrently
const urls = ["url1", "url2", "url3"];
const loaders = urls.map(url => new CheerioWebBaseLoader(url));

// Load in parallel
const results = await Promise.all(
  loaders.map(loader => loader.load())
);
const allDocs = results.flat();
```

## Explicit Boundaries

### ✅ Agents CAN:
- Load documents from PDFs, web pages, text files, and more
- Access and modify document metadata
- Load multiple files from directories
- Parse HTML with custom selectors
- Load remote content from URLs
- Batch process document sets
- Handle both Node.js and browser environments

### ❌ Agents CANNOT:
- Load documents without proper credentials/access
- Automatically fix corrupted files
- Load password-protected PDFs without password
- Parse heavily obfuscated content
- Access documents behind authentication without tokens
- Load files larger than memory (need streaming)

## Gotchas

1. **Page vs Document**: PDF loaders create one Document per page
   ```typescript
   // Each page is separate
   const loader = new PDFLoader("10_page_doc.pdf");
   const docs = await loader.load();  // Returns 10 Documents
   ```

2. **Web Content Cleanup**: Web pages include navigation, ads, etc.
   ```typescript
   // Filter to main content only
   new CheerioWebBaseLoader(url, { selector: ".article" })
   ```

3. **Browser vs Node.js**: Some loaders are environment-specific
   ```typescript
   // Node.js
   import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
   
   // Browser
   import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
   ```

4. **Metadata Preservation**: Add metadata before splitting
   ```typescript
   docs.forEach(doc => {
       doc.metadata.sourceFile = filename;
       doc.metadata.loadedAt = new Date().toISOString();
   });
   ```

5. **Async Loading**: All loaders are async
   ```typescript
   // Always await
   const docs = await loader.load();
   ```

## Full Documentation

- [Document Loaders Overview](https://docs.langchain.com/oss/javascript/integrations/document_loaders/index)
- [PDF Loaders](https://docs.langchain.com/oss/javascript/integrations/document_loaders/index#pdfs)
- [Web Loaders](https://docs.langchain.com/oss/javascript/integrations/document_loaders/index#webpages)
- [Document Interface](https://docs.langchain.com/oss/javascript/langchain/knowledge-base#documents-and-document-loaders)
