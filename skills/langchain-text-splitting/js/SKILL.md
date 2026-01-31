---
name: langchain-text-splitting
description: Guide to splitting documents into chunks for RAG applications. Covers RecursiveCharacterTextSplitter, structure-based splitting (HTML, Markdown, JSON), chunk size optimization, and overlap strategies.
language: js
---

# langchain-text-splitting (JavaScript/TypeScript)

---
name: langchain-text-splitting
description: Guide to splitting documents into chunks for RAG applications. Covers RecursiveCharacterTextSplitter, structure-based splitting (HTML, Markdown, JSON), chunk size optimization, and overlap strategies.
language: js
---

# Text Splitting with LangChain (JavaScript/TypeScript)

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

```typescript
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // Maximum chunk size in characters
  chunkOverlap: 200,    // Overlap between chunks
});

// Split text
const text = "Your long document text here...";
const chunks = await textSplitter.splitText(text);

// Split documents
import { Document } from "@langchain/core/documents";
const docs = [new Document({ pageContent: text })];
const splitDocs = await textSplitter.splitDocuments(docs);

console.log(`Created ${splitDocs.length} chunks`);
```

### How It Works

Tries separators in order: `\n\n` → `\n` → ` ` → ``

```typescript
// Default separators (in order of preference)
const separators = [
  "\n\n",  // Paragraphs
  "\n",    // Lines
  " ",     // Words
  ""       // Characters
];

// Example with custom separators
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 20,
  separators: ["\n\n", "\n", " ", ""]
});
```

## Chunk Size and Overlap

### Choosing Chunk Size

| Chunk Size | Use Case | Pros | Cons |
|------------|----------|------|------|
| 200-500 | Precise Q&A | Focused results | May lose context |
| 1000-1500 | General RAG | Balanced | Standard choice |
| 2000-3000 | Document summaries | Full context | Less precise |

```typescript
// Small chunks - precise answers
const preciseSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50
});

// Medium chunks - general use
const generalSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});

// Large chunks - context-heavy
const contextSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 400
});
```

### Overlap Strategy

Overlap prevents splitting important context across chunks.

```typescript
// No overlap - may break context
const noOverlap = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 0  // Not recommended
});

// Good overlap - maintains context
const withOverlap = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200  // 20% overlap
});

// Example showing overlap
const text = "A".repeat(1000) + "B".repeat(1000);
const chunks = await withOverlap.splitText(text);
// chunk[0]: A...AAA BBB (last 200 chars have B)
// chunk[1]: BBB B...BB (first 200 chars repeat from chunk[0])
```

## Structure-Based Splitting

### Markdown Splitter

Preserves markdown structure (headers, lists, code blocks).

```typescript
import { MarkdownTextSplitter } from "@langchain/textsplitters";

const markdownText = `
# Main Title

## Section 1
Content here...

## Section 2
More content...
`;

const mdSplitter = new MarkdownTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 100
});
const chunks = await mdSplitter.splitText(markdownText);
```

### HTML Splitter

Respects HTML structure and tags.

```typescript
import { HTMLTextSplitter } from "@langchain/textsplitters";

const htmlString = `
<html>
<body>
    <h1>Main Title</h1>
    <p>Introduction...</p>
    <h2>Section 1</h2>
    <p>Content...</p>
</body>
</html>
`;

const htmlSplitter = new HTMLTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200
});
const chunks = await htmlSplitter.splitText(htmlString);
```

### Code Splitter

Language-aware code splitting.

```typescript
import { 
  RecursiveCharacterTextSplitter,
  SupportedTextSplitterLanguages
} from "@langchain/textsplitters";

const pythonCode = `
def function1():
    pass

def function2():
    pass

class MyClass:
    def method(self):
        pass
`;

// Python-specific splitter
const pythonSplitter = RecursiveCharacterTextSplitter.fromLanguage(
  "python" as SupportedTextSplitterLanguages,
  {
    chunkSize: 500,
    chunkOverlap: 0
  }
);
const chunks = await pythonSplitter.splitText(pythonCode);
```

### JSON Splitter

Preserves JSON structure.

```typescript
import { RecursiveJsonSplitter } from "@langchain/textsplitters";

const jsonData = {
  users: [
    { name: "Alice", email: "alice@example.com" },
    { name: "Bob", email: "bob@example.com" }
  ],
  settings: {
    theme: "dark",
    language: "en"
  }
};

const jsonSplitter = new RecursiveJsonSplitter({
  maxChunkSize: 100
});
const chunks = jsonSplitter.splitJson(jsonData);
```

## Token-Based Splitting

Split based on token count instead of characters.

```typescript
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { encodingForModel } from "js-tiktoken";

// Using tiktoken for OpenAI models
const tokenSplitter = new CharacterTextSplitter({
  chunkSize: 100,      // 100 tokens
  chunkOverlap: 0,
  separator: "\n"
});

// Custom length function using tiktoken
const encoding = encodingForModel("gpt-4");
const customSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 10,
  lengthFunction: (text: string) => encoding.encode(text).length
});
```

## Working with Documents

### Split Loaded Documents

```typescript
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Load PDF
const loader = new PDFLoader("document.pdf");
const docs = await loader.load();

// Split documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const allSplits = await textSplitter.splitDocuments(docs);

// Metadata is preserved
allSplits.slice(0, 3).forEach(split => {
  console.log(`Source: ${split.metadata.source}`);
  console.log(`Page: ${split.metadata.loc?.pageNumber}`);
  console.log(`Content: ${split.pageContent.slice(0, 100)}...\n`);
});
```

### Add Custom Metadata

```typescript
// Split and enhance metadata
const splits = await textSplitter.splitDocuments(docs);

splits.forEach((split, i) => {
  split.metadata.chunkId = i;
  split.metadata.totalChunks = splits.length;
  split.metadata.chunkSize = split.pageContent.length;
});
```

## Decision Table: Choosing a Splitter

| Content Type | Splitter | Settings |
|--------------|----------|----------|
| Plain text | `RecursiveCharacterTextSplitter` | chunkSize=1000, overlap=200 |
| Markdown docs | `MarkdownTextSplitter` | Preserves headers |
| HTML pages | `HTMLTextSplitter` | Respects tags |
| Code files | `RecursiveCharacterTextSplitter.fromLanguage()` | Language-specific |
| JSON data | `RecursiveJsonSplitter` | Structure-aware |
| Token limits | Custom with `lengthFunction` | Exact token count |

## Advanced Techniques

### 1. Custom Separators

```typescript
// Split on custom markers
const customSplitter = new RecursiveCharacterTextSplitter({
  separators: ["###", "\n\n", "\n", " "],
  chunkSize: 1000,
  chunkOverlap: 100
});
```

### 2. Length Function

```typescript
import { encodingForModel } from "js-tiktoken";

// Use token counter as length function
const encoding = encodingForModel("gpt-4");

const tokenAwareSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 10,
  lengthFunction: (text: string) => {
    return encoding.encode(text).length;
  }
});
```

### 3. Language-Specific Splitting

```typescript
const jsSplitter = RecursiveCharacterTextSplitter.fromLanguage(
  "js",
  { chunkSize: 500, chunkOverlap: 0 }
);

const pythonSplitter = RecursiveCharacterTextSplitter.fromLanguage(
  "python",
  { chunkSize: 500, chunkOverlap: 0 }
);
```

## Best Practices

### 1. Match Chunk Size to Use Case

```typescript
// Q&A over documentation
const qaSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150
});

// Long-form content analysis
const analysisSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 400
});
```

### 2. Test Different Sizes

```typescript
async function testChunkSizes(
  text: string,
  sizes: number[] = [500, 1000, 1500]
): Promise<void> {
  for (const size of sizes) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: size,
      chunkOverlap: Math.floor(size * 0.1)
    });
    const chunks = await splitter.splitText(text);
    const avgLength = chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length;
    console.log(`Size ${size}: ${chunks.length} chunks`);
    console.log(`  Avg length: ${avgLength.toFixed(0)}`);
  }
}
```

### 3. Preserve Metadata

```typescript
// Always use splitDocuments to keep metadata
const splits = await textSplitter.splitDocuments(docs);  // ✅ Keeps metadata

// Not: await textSplitter.splitText(text)  // ❌ Loses metadata
```

## Explicit Boundaries

### ✅ Agents CAN:
- Split text by characters, tokens, or custom separators
- Preserve document structure (headers, code blocks)
- Configure chunk size and overlap
- Handle various content types (markdown, HTML, JSON, code)
- Split multiple documents in batch
- Use custom length functions (e.g., token counters)

### ❌ Agents CANNOT:
- Automatically determine optimal chunk size
- Understand semantic meaning without embeddings
- Prevent all context loss at split boundaries
- Split without some information loss
- Guarantee chunks fit exact token limits (character-based)
- Maintain perfect document structure across splits

## Gotchas

1. **Character vs Token Count**: chunkSize is in characters, not tokens
   ```typescript
   // 1000 characters ≈ 250-300 tokens for English text
   chunkSize: 1000  // This is characters!
   ```

2. **Overlap is Included in Chunk Size**: Overlap chars count toward chunkSize
   ```typescript
   // Effective unique content per chunk
   const uniqueContent = chunkSize - chunkOverlap;
   ```

3. **Async Methods**: All split operations are async
   ```typescript
   // Always await
   const chunks = await textSplitter.splitText(text);
   const splits = await textSplitter.splitDocuments(docs);
   ```

4. **Metadata Preservation**: Use splitDocuments, not splitText
   ```typescript
   // Preserves metadata ✅
   const splits = await textSplitter.splitDocuments(docs);
   
   // Loses metadata ❌
   const text = docs.map(d => d.pageContent).join("\n\n");
   const chunks = await textSplitter.splitText(text);
   ```

5. **Empty Chunks**: Can occur with small chunkSize
   ```typescript
   // Filter out empty chunks
   const splits = (await textSplitter.splitDocuments(docs))
     .filter(s => s.pageContent.trim());
   ```

## Full Documentation

- [Text Splitters Overview](https://docs.langchain.com/oss/javascript/integrations/splitters/index)
- [RecursiveCharacterTextSplitter](https://docs.langchain.com/oss/javascript/integrations/splitters/index#text-structure-based)
- [Splitting Tutorial](https://docs.langchain.com/oss/javascript/langchain/rag#splitting-documents)
