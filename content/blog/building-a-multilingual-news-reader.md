---
title: RSS feeds, turned into source-linked answers
date: '2026-11-16'
category: Engineering note
readTime: 8 min read
summary: How I turned multilingual RSS feeds into a searchable reader, and the decisions, trade-offs, and limits behind its ingestion and answer pipeline.
intro: 'I started Wassla with a question: could I make one reader for news arriving through RSS in different languages, and help people find stories by meaning rather than exact wording? I turned that question into a pipeline that keeps each publisher’s source visible while generating translations, summaries, categories, and answers. Here I explain the choices I made, what they cost, and what the implementation does not prove.'
coverImage:
  url: /covers/wassla-app.jpg
  alt: Illustration of RSS feeds flowing into a multilingual news search.
  width: 1024
  height: 768
  mimeType: image/jpeg
references:
  - title: Architecture and request flows
    url: https://github.com/ali-ncibi/wassla-app/blob/main/docs/architecture.md
  - title: Article graph, prompts, and stages
    url: https://github.com/ali-ncibi/wassla-app/tree/main/pipeline/app/graph
  - title: Database schema and persistence
    url: https://github.com/ali-ncibi/wassla-app/blob/main/db/init/02_schema.sql
  - title: Vector search and answer generation
    url: https://github.com/ali-ncibi/wassla-app/blob/main/pipeline/app/rag.py
  - title: Evaluation and observability workflow
    url: https://github.com/ali-ncibi/wassla-app/blob/main/docs/observability.md
  - title: Setup and reproduction commands
    url: https://github.com/ali-ncibi/wassla-app/blob/main/docs/quickstart.md
---

## The problem to solve

RSS gave me a useful starting point: publishers expose new entries, but following many feeds still means dealing with different languages, formats, and levels of detail. Some entries include a useful excerpt; others provide only a short description. A keyword search can also miss a relevant story when the reader’s question and the article use different words.

I therefore gave the system a bounded task: collect entries from a known set of feeds, keep each source and URL, create searchable English, French, and Arabic versions, and help readers find items or ask questions about them. My hypothesis is that shared-language summaries and semantic search can make a collection easier to explore. That is a design goal, not a measured result or a way to establish what is true.

I also drew a line around the problem. Wassla indexes the material exposed by feeds; it does not fetch and verify every publisher’s full article, compare independent reporting, or replace editorial judgement.

## Separating responsibilities

I separated the system into four responsibilities. PostgreSQL stores sources, original article records, translations, and embeddings; pgvector handles nearest-neighbour search. A FastAPI service coordinates feed ingestion, model calls, storage, search, and the read API. A Nuxt application presents the reader and reaches that API through a server-side proxy. Phoenix receives traces so I can inspect model and pipeline runs during development.

I run these services together with Docker Compose. Ingestion is scheduled from the database: pg_cron runs every 15 minutes, and pg_net calls the token-protected pipeline endpoint. The web proxy permits GET and HEAD requests and blocks the ingest path, so the browser never needs the ingest token.

This split makes it clear where work belongs: the browser displays results, the pipeline handles feed and model work, and the database keeps records and performs vector search. The cost is operational weight. A local deployment needs several services and PostgreSQL extensions instead of a single application process.

<figure>
  <video class="w-full rounded-md border-2 border-slate-900 bg-black dark:border-slate-700" controls preload="metadata" aria-label="Wassla project walkthrough">
    <source src="/videos/ali-ncibi-wassla-app-explained.mp4" type="video/mp4">
    Your browser does not support embedded video.
  </video>
  <figcaption>Wassla project walkthrough</figcaption>
</figure>

## Turning each article into explicit stages

I made ingestion a sequence of visible decisions. The graph fetches active RSS sources, extracts feed content as text, and compares item URLs with records already stored. It skips entries without a usable link, title, or sufficiently long body, then sorts the remaining entries by publication time and applies the configured item limit. The seed data currently contains 18 English-, French-, and Arabic-language feeds. A failed feed fetch is skipped rather than reported as a source-specific ingest error; failures while processing individual articles are collected separately.

For each new article, a LangGraph subgraph runs six ordered stages. First, it translates the title and body into the configured languages, reusing the original when a target language is already the source language. Second, it assigns one category from the configured list using the original title and body. Third, it writes a short summary for each language from that language’s article text. Fourth, an evaluator scores the result and lists issues; depending on the selected provider, it can use a separate model configuration. Fifth, the system embeds each language’s title, summary, and a bounded part of its body. Finally, it stores the original and language-specific records in one database transaction.

Different articles can move through the graph at the same time, but the stages for one article stay ordered: translations must exist before summaries and embeddings can use them. A semaphore limits simultaneous model and embedding requests. Keeping the steps separate makes them easier to inspect and tune than one large prompt, but it does not remove model latency, cost, or failure.

```text
RSS entry → extract and deduplicate
           → translate → categorize → summarize
           → evaluate → embed → persist
Question  → embed → language-filtered vector search
           → answer from retrieved source records
```

## Keeping source records separate from translations

I model an article and its language versions separately. The article row keeps the source URL, original language, original title and body, category, dates, and evaluation fields. Each related translation row stores a language-specific title, body, summary, and 1024-dimensional embedding. The translation is keyed by article ID and language, while the source URL is unique.

This avoids treating a translation as a new article. The reader can show which languages are available without losing the publisher link, and search can stay within the requested language. The tradeoff is duplicated text and one vector per stored language, so storage grows with both the number of articles and the number of languages.

I also bounded the text sent for embedding: the title, summary, and at most the first 6,000 characters of the translated body. That makes requests more predictable, but details later in a long article cannot affect its vector.

## Retrieving evidence before generating answers

I kept search and answer generation as two steps. The pipeline embeds the question, asks PostgreSQL for the nearest translation vectors in the requested language using cosine distance, keeps the configured number of candidates, and removes candidates below a similarity threshold. With the defaults, it considers up to five candidates and uses a threshold of 0.35; both values are configurable.

When answer generation is enabled and at least one result remains, the model receives each result’s title, summary, and source URL—not the full article body—and is told to answer only from that context. It is also asked to mark sources as [1], [2], and so on. The API returns the answer and ordered search hits, which the page displays together.

I chose this separation so readers can inspect the retrieved records even if no answer is produced. But a similarity score is not the probability that a result is relevant, and the citation markers are not independently checked. An answer can omit a useful source, misstate context, or use a marker incorrectly. The links help readers inspect the evidence; they do not guarantee correctness.

## Evaluation as a signal, not a fact check

I use the evaluator to flag items, not to decide whether they are true. It receives the original title and up to 2,000 characters of the original body, together with translated titles, summaries, and the selected category. Its score is clamped to 0–10. A score below the configured threshold marks an item as needing review, but the item is still stored, and current listing and search queries do not filter it out. The dashboard counts these items, but there is no built-in human review workflow.

That score is based on a narrow view of the article. The evaluator does not receive the full translated bodies, so it cannot establish that every sentence was translated faithfully. An LLM score also cannot establish factual accuracy against the world or against independent sources.

I included an offline evaluation script that runs the article graph without writing to the database. Its small example set checks for configured languages, summaries, and a score in the expected shape. With a real model provider, it also checks expected categories, the presence of Arabic script, and a model-judged score. These checks can catch regressions, but they do not measure end-to-end search relevance or verify answer citations.

## Making runs inspectable and repeatable

I added OpenInference instrumentation to send graph and model-call traces to the local Phoenix service. Those traces include prompts, completions, model information, latency, and token usage. They help me investigate slow or unexpected runs and compare prompt or model changes. Because traces may contain article text or user queries, I treat their storage with the same care as the application data.

To reproduce the system locally, configure the environment and start the Compose stack with make up. Meaningful translations, embeddings, and answers require credentials for a supported model provider. Stub chat and embedding providers allow a deterministic smoke run without API keys, but they do not produce meaningful translations or demonstrate semantic search quality. One command detail is easy to miss: make check runs lint with automatic fixes before type checks and tests, so it can modify files. For read-only checks, run make lint, make typecheck, and make test separately. Run make evals to compare graph behavior on the supplied examples; checks that call a real provider run only when one is selected.

The design lesson I take from Wassla is to preserve the seams: make each transformation a named stage, store source and derived content separately, retrieve before generating, and keep evaluation and tracing close to the workflow. Those choices make the system easier to reproduce and improve. They do not turn generated text into verified journalism.
