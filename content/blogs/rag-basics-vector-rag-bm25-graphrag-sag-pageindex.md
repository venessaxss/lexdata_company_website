---
title: "RAG Basics: Vector RAG, BM25, GraphRAG, SAG and PageIndex Explained"
date: "2026-09-19"
excerpt: "How the main RAG approaches work and evolve: vector search, BM25 hybrid retrieval, knowledge graphs, structured SQL-based RAG and vectorless PageIndex."
aiModels: []
category: "Guides"
publisher: "LexData"
readTime: "11 min read"
coverImage: "/blog/
rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic1.jpg"
---

You've probably read many articles about RAG, each presenting some new technique or idea and claiming it will “kill RAG”.

In my view, most of that is just hype to grab attention. In fact, many of them still fall under RAG in the broad sense.

## Why do we need RAG?

RAG exists to solve two big problems of large models: limited context and hallucination.

A large language model (LLM) is trained on massive amounts of data. What you actually use (for reasoning — in simple terms, Q&A) is a weights file: think of it as a compressed package of knowledge. The model itself is “stateless”; its knowledge basically freezes at the moment its training data ends.

There's a lot the model doesn't know: your company's internal documents, your private data, time-sensitive industry news, and so on. Ask about something the LLM doesn't know and it starts making things up (fabricating facts — the so-called “hallucination”).

RAG attaches an external knowledge base to the LLM — during Q&A it “slips the model a cheat sheet” — to solve the hallucination problem.

## How RAG works

RAG stands for Retrieval-Augmented Generation — “retrieval-augmented generation” — three English words put together.

![RAG system working principle in one image: question, embedding, vector search, prompt assembly and answer generation](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic2.jpg)

The G (Generation) means working with the LLM to answer questions, i.e., generating the answer.

But the hardest part is building the “retrieval” side. Building a knowledge base is essentially building this “retrieval engine”, and most of that work doesn't involve the LLM. This article won't go into the G (generation) part either.

## RAG 1.0 (Vector RAG)

![RAG 1.0 Vector RAG: knowledge base building and user query pipeline](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic3.jpg)

This is the most widely used and most classic RAG pattern. Its core workflow: parse the document, split it into chunks, index them as vectors, and retrieve relevant content by similarity.

```text
// Classic RAG build pipeline
// Reranking, filtering, etc. are post-processing; not covered here
Parse documents → Chunk text → Vectorize text → Store in a vector database → Retrieve by vector similarity
```

This pattern relies on **“vectors”**: in the world of large models, a vector turns human content — language, images, audio — into a list of numbers. Large models can’t understand human language directly (e.g., the word “apple”), so an embedding model is used to convert words and sentences into a long sequence of numbers. For example, representing “apple” in 3 dimensions:

```text
// Shown here in 3 dimensions; in practice dimensions are usually much higher (e.g., 1024), called a high-dimensional space
apple -> [0.8, 0.7, 0.9]
```

Vectors can “understand” meaning: words and sentences with similar meanings have similar number sequences. In vector space, “apple” is close to “banana” but very far from “computer”. This is exactly how semantic similarity is judged — by computing the spatial distance between two vectors.

That's why a vector database (e.g., Milvus, Pinecone, LanceDB) is a necessary module in such systems. These databases wrap the entire complex process into SDKs/APIs, so you can just make calls to them.

Vectors understand “meaning” and are computationally efficient, but they have quite a few drawbacks:

- It lacks multi-hop reasoning. For example, “What projects did Zhang San work on at Li Si's company?” (Later, GraphRAG — based on graph databases — was introduced to solve exactly this.)

- It can’t handle queries with complex logic or filters, such as: “Find research reports published after 2025, about agents deployed in enterprises, longer than 5,000 words.” (This is trivial in an SQL database.)

- It tends to produce noise. Many phrases end up numerically close in vector space while meaning the opposite. For example, **“I bought an Apple computer last year”** and **“I ate an apple yesterday”** would be judged highly similar, letting irrelevant content into the LLM context and hurting answer quality.

It is only good at semantic “fuzzy matching”.

## RAG 1.5 (Hybrid Search)

To make up for the fact that vectors only handle fuzzy semantic search, the traditional keyword retrieval algorithm (**BM25**) was brought back.

![RAG 1.5 hybrid search: vector search combined with BM25 keyword search](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic4.jpg)

In many scenarios users want exact lookups — queries like “ID 9527” or “iPhone 16 Pro Max” — and this is where BM25 keyword retrieval shines.

“BM” stands for Best Match, and “25” is the 25th iteration of the algorithm (the first 24 weren't great). It dates back to the 1990s and is the foundation of many search engines.

Its core logic: look at how often a keyword appears in a document and how rare it is. The more frequent and rarer the term, the higher the document's weight (and the higher it ranks).

In practice, vector retrieval and BM25 are often combined — this is called hybrid search. For example, the vector database Milvus has BM25 and hybrid search built in, which is very convenient.

```text
// Milvus vector database
https://github.com/milvus-io/milvus
```

Today, hybrid retrieval combining vectors + BM25 keywords has become the standard setup for mainstream knowledge bases.

## RAG 2.0 (GraphRAG)

![RAG 2.0 GraphRAG: building a knowledge graph and answering a multi-hop query](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic5.jpg)

So what about multi-hop queries over complex relationships? Attention turned to graph databases. Microsoft even open-sourced a GraphRAG project as a demonstration:

```text
https://github.com/microsoft/graphrag
```

A graph database turns knowledge into a web of relationships: the lines are “edges”, and the points where lines meet are “nodes”.

- “Nodes” represent the “entities” in knowledge — people, places, events, companies, and so on.

- “Edges” represent the “relations” between pieces of knowledge: descriptions like works at, happened in, or launched can all be edges.

For example: “Zhang San joined Tencent in 2026, mainly responsible for developing the company's knowledge base product ima.” In a graph database this becomes:

```text
// Zhang San, Tencent, and the ima knowledge base are entities; the rest are edges
Zhang San - joined in 2026 -> Tencent
Zhang San - developed -> ima knowledge base
Tencent - owns product -> ima knowledge base
```

Here's the question: how are these entities and relations built? Extracting them manually is impractical.

It relies mainly on LLMs to extract entities and relations. The build pipeline:

```text
// Notice: chunking is still needed here!
// Why vectorization too? For hybrid retrieval later
Parse docs → Chunk text ─┬─> Extract entities & relations → Global merge (dedupe) → Store in graph DB (Graph)
                         └─> Vectorize text → Store in vector DB (Vector)
```

Feed thousands of documents to a large model and it extracts the entities and relations, storing them in a graph database — building a vast “web of knowledge” called a knowledge graph.

### Relationship search is the knowledge graph's strength

A graph database searches by crawling along edges (relations) step by step. For example, if a user asks: “What products does Zhang San’s company make?”, vector search may fail to connect “Zhang San” with “products” — but the graph database can:

1. Find “Zhang San”
2. Find the company he joined, “Tencent”
3. Find the “ima knowledge base”

The answer is found after two hops — technically called multi-hop reasoning. Even with huge amounts of data, graph databases still handle relation retrieval extremely fast.

You may have already realized: using LLMs to extract relations and entities is itself a problem. LLM capabilities vary and they hallucinate, so there's no guarantee the extracted content is complete or accurate.

We wanted RAG to solve the LLM’s hallucination problem — yet while building RAG, we end up introducing “hallucination” first!

Besides, extracting entities and relations with LLMs burns a huge number of tokens, and maintenance is costly and slow — updating one file may force the whole graph to be recomputed.

With so many problems in GraphRAG, is there a better way?

## RAG Evolution & Enhancement (Structured RAG / SAG)

Graph databases are slow and expensive to update and depend heavily on LLMs. Let’s try another approach: instead of building a complex “global graph”, extract “entities” and “events” from the chunks and store them in an SQL database; when a user asks a question, dynamically stitch related events together with SQL statements — this is the idea of SQL-RAG.

![Structured RAG (SAG): vector recall to find clues, SQL relational database to expand relationships](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic6.jpg)

**Vectors remain their center stage.** SAG is essentially vector RAG with an added layer of SQL structured queries. In real knowledge base implementations, we also tag chunks (extracting keywords with an LLM, then using the chunk's mapped keywords to query the relational database back via SQL during retrieval).

```text
// Paper
https://arxiv.org/abs/2606.15971

// Open-source reference repo
https://github.com/Zleap-AI/SAG
```

SAG's overall logic is more comprehensive than simple tagging; it achieves something like a knowledge graph while making “graph building” much simpler. The build pipeline:

```text
// Extract events and entities
Parse docs → Chunk text ─┬─> (LLM extracts events & entities) → Store in relational DB (SQL)
                         └─> (Vectorize text) → Store in vector DB (Vector)
```

The build process still involves document parsing, chunking, and vector indexing; the special part is the extraction of events and entities.

### Extracting entities and events

LLMs analyze the chunked text, answering just two questions: what happened (the event)? What did it involve (the entities)?

Using the same example: “Zhang San joined Tencent in 2026, mainly responsible for developing the company's knowledge base product ima.” It gets extracted as:

1. Event: Zhang San joined Tencent and developed ima (time: 2026)
2. Related entities: Zhang San, Tencent, ima

The results are then stored in a relational database (e.g., SQLite, PostgreSQL), with two tables:

1. Event table: records event content and when it happened
2. Entity-relation table: records which entities appear in each event

### How is multi-hop querying implemented?

It combines vector semantic search with SQL queries — a two-pronged approach.

1. Find the “seed” chunk via vector semantic search
2. Then use the original chunk's mapping to find records in the SQL database and pull out entities and events
3. Query the SQL database precisely with the entity and get all events related to Zhang San
4. Finally, package the original chunk together with the events assembled via SQL, and inject them into the LLM context

For example, a user asks: “The person who joined Tencent in 2026 — what did he do at Alibaba before?” The full execution chain:

1. Vector semantic search first retrieves chunks containing “Tencent”, maps them to the entity “Tencent”, then queries “Tencent” precisely in SQL, finding the event: “Zhang San joined Tencent in 2026”.
2. Based on that event’s record in SQL, another entity is found: “Zhang San”.
3. Using “Zhang San” as a new lead, continue querying the SQL database precisely.
4. Getting all of Zhang San's data reveals all his experience and events.

This is essentially like a graph database's multi-hop query (2 hops in this example).

Events act as the retrieval bridge and leads in the system; during Q&A they’re also injected into the context as high-purity “cheat sheets”.

**At the end of the day, SAG is still RAG. Whether it can replace GraphRAG, I won’t say for sure — but its ideas are worth learning.**

## Another Paradigm: PageIndex — No Vectors, No Chunking

No matter how RAG, BM25, or SAG evolve, they all rely to some degree on vectors and document chunking. But there’s a genuinely different path:

![PageIndex: no vectors, no chunking. Build a directory tree, search by tree, then read the original section](/blog/rag-basics-vector-rag-bm25-graphrag-sag-pageindex/Pic7.jpg)

PageIndex, proposed by Vectify AI, uses no vectors and no chunking. The project is open source at:

```text
https://github.com/VectifyAI/PageIndex
```

Its working logic still follows a RAG-like flow:

1. First, build an indexable table-of-contents tree (**JsonTree**) for the document and produce a TOC tree JSON file. The tree records every section, node, and its location (page, line), and can even generate a summary for each node.
2. During Q&A, the LLM first looks at the tree and figures out which sections hold the answer.
3. With the section indices, it locates the corresponding text in the original document, extracts the full content, and injects it into the context.

```text
// PageIndex build pipeline
Parse docs → Build TOC tree (LLM-based) → Store tree (JsonTree) → Navigate and retrieve via the tree (LLM-based)
```

This works a lot like a human looking up a reference: check the table of contents for the page, then flip straight to it.

You'll notice it needs no chunking or vector processing at all — but every step depends heavily on the LLM: building the index, generating summaries, and the retrieval itself. In real deployments, I doubt small models can pull this off (weak capability and serious hallucination — they can't even build the tree properly!).

It also seems to struggle with massive document collections. It works well for Q&A over a single document (say 100 pages), but what about 100 or 1,000 documents? How would that work?

```text
// Thoughts on handling massive document collections
1. Use vector retrieval to narrow the candidates, then inject each hit's JsonTree (into the LLM)
2. Build a file-level TOC tree over all documents, letting the AI open subdirectories level by level like a human browsing folders
```

## Wrapping up

From classic vector RAG and BM25-based hybrid search, through GraphRAG and SAG, to the unconventional PageIndex, this article covers nearly all mainstream RAG paradigms.

In real-world deployment, there's no single best option; usually several modes are combined.

For now, “vector RAG + BM25” is the most solid and cost-effective path for enterprise knowledge bases; GraphRAG fills in the relational retrieval for multi-hop reasoning; and SAG’s ideas are worth trying as a lightweight way to gain graph-like capabilities.

No technology is absolutely better or worse — there's only what fits the business scenario best.

If you want to see real-world deployment and implementation details of RAG knowledge base systems, here are some recommended reads (the linked articles are in Chinese):

- [WeKnora, Tencent’s open-source enterprise RAG knowledge base (with Wiki support) — 18k stars, ready to use out of the box](https://mp.weixin.qq.com/s?__biz=Mzk0MzY4NzUzMQ==&mid=2247484403&idx=1&sn=51d9e8e049ab13db1545fe805a9b77c4&scene=21#wechat_redirect)

- [Learning RAG by dissecting Tencent’s open-source WeKnora: chunking strategies explained](https://mp.weixin.qq.com/s?__biz=Mzk0MzY4NzUzMQ==&mid=2247484418&idx=1&sn=9102a0ef8e53789ebae20d5a3674e7c8&scene=21#wechat_redirect)

- [Learning RAG from WeKnora: multi-channel RRF fusion retrieval, ranking, and chunk merging strategies](https://mp.weixin.qq.com/s?__biz=Mzk0MzY4NzUzMQ==&mid=2247484428&idx=1&sn=d74956ad1ed3529df78ea0b6787a8b3a&scene=21#wechat_redirect)


