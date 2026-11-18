export interface BlogSection {
  heading: string
  paragraphs: string[]
  code?: { language: string; content: string }
  video?: { src: string; caption: string; poster?: string }
}

export interface BlogSeries {
  title: string
  part: number
  total: number
  repositoryUrl: string
  sourceFiles: string[]
  previousSlug?: string
  nextSlug?: string
  discussionEmail?: string
}

export interface BlogReference {
  title: string
  url: string
}

export interface BlogCoverImage {
  url: string
  alt: string
  width: number
  height: number
  mimeType: 'image/avif' | 'image/gif' | 'image/jpeg' | 'image/png' | 'image/webp'
}

export interface BlogPost {
  slug: string
  title: string
  date: string
  category: string
  readTime: string
  excerpt: string
  intro: string
  sections: BlogSection[]
  coverImage: BlogCoverImage
  relatedPublicationUrls?: string[]
  series?: BlogSeries
  references?: BlogReference[]
}

export const posts: BlogPost[] = [
  {
    slug: 'scaling-llm-inference-by-queue-depth',
    title: 'Scaling LLM inference by watching the queue',
    date: 'November 2026',
    category: 'Engineering note',
    readTime: '9 min read',
    excerpt:
      'How I tested queue-based scaling for self-hosted LLM inference on a small Kubernetes cluster, and what the results do—and do not—show.',
    intro:
      'I built llm-stack to test a concrete operations question: can a small, CPU-only Kubernetes cluster run a self-hosted chat service and add inference capacity when requests begin to queue? To answer it, I had to look beyond the chat interface to model memory, cold starts, storage, and the signal that triggers scaling. This is a case study of that deployment, not a general capacity benchmark.',
    coverImage: {
      url: '/covers/llm-stack.jpg',
      alt: 'Illustration of an AI chat model monitored by metrics and served across Kubernetes nodes.',
      width: 1024,
      height: 768,
      mimeType: 'image/jpeg',
    },
    sections: [
      {
        heading: 'Start with the queue, not the interface',
        paragraphs: [
          'I began by tracing one chat request: the browser sends it to Open WebUI, the UI calls an OpenAI-compatible endpoint, and vLLM runs the model. When generation slows, requests collect at inference. Adding UI replicas might let the system accept and proxy more requests, but it does not necessarily shorten the model queue.',
          'That led to my main hypothesis: in this deployment, the number of running and waiting inference requests is a more useful signal for scaling vLLM than CPU use in the UI. I do not treat that as a universal rule; another model server, workload, or bottleneck could need a different metric. I wanted to make the hypothesis testable on a deliberately small cluster.',
          'The example uses three OVH MKS nodes, each described as 2 vCPU and 8 GiB of memory. On that budget, decisions that can be easy to overlook on a large GPU cluster—model size, shared memory, replica startup, and storage attachment—become central to the design.',
        ],
      },
      {
        heading: 'Fit the model to the node budget',
        paragraphs: [
          'Before adding replicas, I needed a model configuration that could run on one node. The deployment serves Qwen2.5-0.5B-Instruct with vLLM’s CPU image, bfloat16, an 8,192-token context limit, at most two sequences per engine, and a 512 MiB KV-cache allocation. Each pod requests 4 GiB of memory and has a 6 GiB limit; a memory-backed 1 GiB volume supplies /dev/shm. These settings describe this small CPU example, not tuning advice that applies to every model.',
          'I also had to account for what the client sends. Open WebUI may include tool descriptions even with a short prompt, so part of a small context can be used before the conversation itself. The UI sends tool_choice: auto; vLLM is therefore configured for automatic tool choice with its Hermes parser. A small model and short output limits reduce the demo’s footprint, but also limit capability and answer quality. After observing slow CPU prefill, I set OMP_NUM_THREADS to 2. I also set VLLM_PORT explicitly because Kubernetes injects a variable with that name for a Service named vllm.',
          'The lesson from this setup is to measure the serving process and tune context, concurrency, cache, shared memory, and CPU threads together. Increasing replicas without budgeting memory for each one can leave new pods Pending instead of adding usable capacity.',
        ],
      },
      {
        heading: 'Separate requests from scaling decisions',
        paragraphs: [
          'I kept the request path short. Open WebUI is the only service exposed through a cloud LoadBalancer, and it forwards model requests to the internal vLLM ClusterIP service at /v1. PostgreSQL with pgvector stores Open WebUI’s database and vector data. Redis provides the UI’s WebSocket manager; the manifest runs it as one replica without a persistent volume. These services support the application; they do not add model capacity.',
          'I kept scaling on a separate control path. Prometheus scrapes vLLM’s /metrics endpoint every 10 seconds. KEDA queries Prometheus and changes the vLLM Deployment’s replica count. Since KEDA runs in another namespace, the scaler uses Prometheus’s fully qualified in-cluster DNS name. Grafana reads Prometheus through a provisioned data source and dashboard. It is a ClusterIP service, so the documented way to inspect it is with a local kubectl port-forward, not another public LoadBalancer.',
          'This separation lets me reason about what happens: chat requests travel to inference, while metrics reach a controller that can change the number of inference pods. The manifest assumes kube-state-metrics is already available at a configured monitoring-service address; it does not install that dependency.',
        ],
        code: {
          language: 'text',
          content:
            'REQUEST:  Browser → LoadBalancer → Open WebUI → vLLM → model\n' +
            'STATE:    Open WebUI → PostgreSQL/pgvector and Redis\n' +
            'CONTROL:  vLLM metrics → Prometheus → KEDA → vLLM replicas\n' +
            'INSPECT:  Prometheus → Grafana (internal service)',
        },
        video: {
          src: '/videos/ali-ncibi-llm-stack-explained.mp4',
          caption: 'LLM stack project walkthrough',
        },
      },
      {
        heading: 'Design storage around attachment limits',
        paragraphs: [
          'Storage shaped the design as much as compute. The managed cluster’s block storage is single-attach, and it does not provide a shared ReadWriteMany volume for pods on different nodes. PostgreSQL, Prometheus, and Grafana each use a 10 GiB ReadWriteOnce claim and one replica. Their Deployments use Recreate so the old pod stops before its replacement attaches the volume. This avoids an attachment conflict, but it does not provide high availability: a restart or node problem can interrupt these services.',
          'For model files, I used a different approach. Each vLLM pod downloads the model into a size-limited emptyDir. That avoids requiring replicas to share storage the cluster cannot provide, but the cache disappears when the pod does. The model is about 1 GiB, and a new replica took roughly two to three minutes to start while downloading and loading it. That delay means the autoscaler can react to a queue long before the added capacity is ready.',
          'Open WebUI’s local files also live in an emptyDir, with a separate copy for each pod. PostgreSQL and Redis coordinate parts of the application, but do not make those files shared. The production notes propose object storage instead. Before increasing replicas, I needed to distinguish data that must persist, data that can be rebuilt, and data that must be shared.',
        ],
      },
      {
        heading: 'Scale on the bottleneck, not a proxy',
        paragraphs: [
          'I configured KEDA’s ScaledObject to target vLLM and query Prometheus for the sum of running and waiting requests. The target threshold is 2; KEDA polls every 15 seconds, uses a 120-second scale-down cooldown, and keeps between one and three replicas. Because the metric includes both running and waiting work, I use it as a pressure signal, not as a direct measure of user-perceived latency. The minimum of one also means the model never scales to zero.',
          'Open WebUI has its own HorizontalPodAutoscaler: one to five replicas, targeting 70% average CPU utilization. A PodDisruptionBudget keeps at least one UI pod available during voluntary disruptions such as node drains, but not during a node failure or application crash. In the recorded run, UI CPU stayed around 4–9% while vLLM scaled. That made UI CPU a poor signal for the inference bottleneck in this particular setup.',
          'A queue signal only helps if it arrives early enough and new pods start before the backlog becomes unacceptable. Here, the Prometheus scrape interval, KEDA polling interval, cooldown, model download, and three-replica maximum all affect response time. I would choose thresholds from measured latency and startup behavior, not copy them as universal defaults. With a strict latency target, a warm spare, a higher minimum, a shared model cache, or an earlier signal may be more appropriate.',
        ],
      },
      {
        heading: 'Measure the whole request path',
        paragraphs: [
          'I wanted to observe the request and cluster together, rather than declare success because the scaler changed a replica count. The load-test scripts send concurrent requests through the chat API and record counts, status codes, latency percentiles, and throughput. A parallel watcher samples running and waiting requests, time to first token, end-to-end latency, replica counts, pending pods, and Kubernetes events every 15 seconds. Together, these signals help separate a slow model from a slow load balancer, a pod still waiting to start, or a scaler that has not reacted yet.',
          'One saved run used repeated short “hi” prompts with a 16-token output limit. At concurrency 4, 97 of 100 requests succeeded; at 12, 200 of 210 succeeded. Both phases included disconnects near 50 seconds, consistent with the load balancer’s observed idle timeout. At concurrency 24, all 394 requests succeeded, throughput was 1.51 requests per second, and client-measured p95 latency was 23.3 seconds. During that phase, KEDA increased vLLM from one to three replicas while Open WebUI stayed at one.',
          'I treat those numbers as evidence about one run, on this cluster, with this request shape. The generator is closed-loop: each worker sends another request after its previous one completes. Short prompts and a small output limit do not represent long-context conversations, diverse users, or production traffic. The result is not “this stack supports 24 users.” It is that the measurements show a bottleneck, the scaler reacting, and the latency and timeout limits that remain.',
        ],
      },
      {
        heading: 'Reproduce the demo, then harden it',
        paragraphs: [
          'To reproduce the experiment, I use a disposable cluster with permission to create the required resources. stack.sh installs KEDA if its custom resource definition is absent, generates local credentials when needed, creates a Kubernetes Secret, and applies the stack manifest. stack.sh check waits for pods to become ready; the first vLLM pod must download the model. The load-test runner then exercises baseline, increasing-concurrency, and cooldown phases and saves measurements and cluster state.',
          'I treat the repository’s access helpers as demo tools, not production defaults. The public UI uses one plain-HTTP LoadBalancer, and the README describes first-user administrator setup. The load-test script assumes demo sign-in details, so I would replace them with a dedicated test account before running it outside an isolated environment. The optional Kubernetes Dashboard helper creates a cluster-admin ServiceAccount and a time-limited token; keep it local and temporary, and do not expose the dashboard. Keep kubeconfigs and generated credentials out of version control, and check the exact config filename against .gitignore before adding it to the repository.',
          'For production, I would need more than a GPU image. The project’s migration notes call for TLS ingress and real identity controls, external secret management, pinned image versions, least-privilege access, durable and shared model and file storage, remote metrics with alerting, and tuning against the actual workload. The method I would carry forward is simpler: map the request and control paths, find the resource that queues, choose a signal close to that bottleneck, then test scale-up delay and user-visible latency with representative traffic.',
        ],
      },
    ],
    references: [
      {
        title: 'Architecture, constraints, and production notes',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/README.md',
      },
      {
        title: 'Kubernetes services, storage, and autoscaling manifest',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/manifests/stack.yaml',
      },
      {
        title: 'Setup and secret-generation helper',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/stack.sh',
      },
      {
        title: 'Load-test phases and metrics watcher',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/loadtest/run.sh',
      },
      {
        title: 'Concurrent request generator',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/loadtest/gen.py',
      },
      {
        title: 'Optional Kubernetes Dashboard helper',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/dash.sh',
      },
      {
        title: 'Kubeconfig and secret ignore rules',
        url: 'https://github.com/ali-ncibi/llm-stack/blob/main/.gitignore',
      },
    ],
  },
  {
    slug: 'building-a-multilingual-news-reader',
    title: 'From RSS feeds to source-linked answers',
    date: 'November 2026',
    category: 'Engineering note',
    readTime: '8 min read',
    excerpt:
      'How I turned multilingual RSS feeds into a searchable reader, and the decisions, trade-offs, and limits behind its ingestion and answer pipeline.',
    intro:
      'I started Wassla with a question: could I make one reader for news arriving through RSS in different languages, and help people find stories by meaning rather than exact wording? I turned that question into a pipeline that keeps each publisher’s source visible while generating translations, summaries, categories, and answers. Here I explain the choices I made, what they cost, and what the implementation does not prove.',
    coverImage: {
      url: '/covers/wassla-app.jpg',
      alt: 'Illustration of RSS feeds flowing into a multilingual news search.',
      width: 1024,
      height: 768,
      mimeType: 'image/jpeg',
    },
    sections: [
      {
        heading: 'The problem to solve',
        paragraphs: [
          'RSS gave me a useful starting point: publishers expose new entries, but following many feeds still means dealing with different languages, formats, and levels of detail. Some entries include a useful excerpt; others provide only a short description. A keyword search can also miss a relevant story when the reader’s question and the article use different words.',
          'I therefore gave the system a bounded task: collect entries from a known set of feeds, keep each source and URL, create searchable English, French, and Arabic versions, and help readers find items or ask questions about them. My hypothesis is that shared-language summaries and semantic search can make a collection easier to explore. That is a design goal, not a measured result or a way to establish what is true.',
          'I also drew a line around the problem. Wassla indexes the material exposed by feeds; it does not fetch and verify every publisher’s full article, compare independent reporting, or replace editorial judgement.',
        ],
      },
      {
        heading: 'Separating responsibilities',
        paragraphs: [
          'I separated the system into four responsibilities. PostgreSQL stores sources, original article records, translations, and embeddings; pgvector handles nearest-neighbour search. A FastAPI service coordinates feed ingestion, model calls, storage, search, and the read API. A Nuxt application presents the reader and reaches that API through a server-side proxy. Phoenix receives traces so I can inspect model and pipeline runs during development.',
          'I run these services together with Docker Compose. Ingestion is scheduled from the database: pg_cron runs every 15 minutes, and pg_net calls the token-protected pipeline endpoint. The web proxy permits GET and HEAD requests and blocks the ingest path, so the browser never needs the ingest token.',
          'This split makes it clear where work belongs: the browser displays results, the pipeline handles feed and model work, and the database keeps records and performs vector search. The cost is operational weight. A local deployment needs several services and PostgreSQL extensions instead of a single application process.',
        ],
        video: {
          src: '/videos/ali-ncibi-wassla-app-explained.mp4',
          caption: 'Wassla project walkthrough',
        },
      },
      {
        heading: 'Turning each article into explicit stages',
        paragraphs: [
          'I made ingestion a sequence of visible decisions. The graph fetches active RSS sources, extracts feed content as text, and compares item URLs with records already stored. It skips entries without a usable link, title, or sufficiently long body, then sorts the remaining entries by publication time and applies the configured item limit. The seed data currently contains 18 English-, French-, and Arabic-language feeds. A failed feed fetch is skipped rather than reported as a source-specific ingest error; failures while processing individual articles are collected separately.',
          'For each new article, a LangGraph subgraph runs six ordered stages. First, it translates the title and body into the configured languages, reusing the original when a target language is already the source language. Second, it assigns one category from the configured list using the original title and body. Third, it writes a short summary for each language from that language’s article text. Fourth, an evaluator scores the result and lists issues; depending on the selected provider, it can use a separate model configuration. Fifth, the system embeds each language’s title, summary, and a bounded part of its body. Finally, it stores the original and language-specific records in one database transaction.',
          'Different articles can move through the graph at the same time, but the stages for one article stay ordered: translations must exist before summaries and embeddings can use them. A semaphore limits simultaneous model and embedding requests. Keeping the steps separate makes them easier to inspect and tune than one large prompt, but it does not remove model latency, cost, or failure.',
        ],
        code: {
          language: 'text',
          content:
            'RSS entry → extract and deduplicate\n' +
            '           → translate → categorize → summarize\n' +
            '           → evaluate → embed → persist\n' +
            'Question  → embed → language-filtered vector search\n' +
            '           → answer from retrieved source records',
        },
      },
      {
        heading: 'Keeping source records separate from translations',
        paragraphs: [
          'I model an article and its language versions separately. The article row keeps the source URL, original language, original title and body, category, dates, and evaluation fields. Each related translation row stores a language-specific title, body, summary, and 1024-dimensional embedding. The translation is keyed by article ID and language, while the source URL is unique.',
          'This avoids treating a translation as a new article. The reader can show which languages are available without losing the publisher link, and search can stay within the requested language. The tradeoff is duplicated text and one vector per stored language, so storage grows with both the number of articles and the number of languages.',
          'I also bounded the text sent for embedding: the title, summary, and at most the first 6,000 characters of the translated body. That makes requests more predictable, but details later in a long article cannot affect its vector.',
        ],
      },
      {
        heading: 'Retrieving evidence before generating answers',
        paragraphs: [
          'I kept search and answer generation as two steps. The pipeline embeds the question, asks PostgreSQL for the nearest translation vectors in the requested language using cosine distance, keeps the configured number of candidates, and removes candidates below a similarity threshold. With the defaults, it considers up to five candidates and uses a threshold of 0.35; both values are configurable.',
          'When answer generation is enabled and at least one result remains, the model receives each result’s title, summary, and source URL—not the full article body—and is told to answer only from that context. It is also asked to mark sources as [1], [2], and so on. The API returns the answer and ordered search hits, which the page displays together.',
          'I chose this separation so readers can inspect the retrieved records even if no answer is produced. But a similarity score is not the probability that a result is relevant, and the citation markers are not independently checked. An answer can omit a useful source, misstate context, or use a marker incorrectly. The links help readers inspect the evidence; they do not guarantee correctness.',
        ],
      },
      {
        heading: 'Evaluation as a signal, not a fact check',
        paragraphs: [
          'I use the evaluator to flag items, not to decide whether they are true. It receives the original title and up to 2,000 characters of the original body, together with translated titles, summaries, and the selected category. Its score is clamped to 0–10. A score below the configured threshold marks an item as needing review, but the item is still stored, and current listing and search queries do not filter it out. The dashboard counts these items, but there is no built-in human review workflow.',
          'That score is based on a narrow view of the article. The evaluator does not receive the full translated bodies, so it cannot establish that every sentence was translated faithfully. An LLM score also cannot establish factual accuracy against the world or against independent sources.',
          'I included an offline evaluation script that runs the article graph without writing to the database. Its small example set checks for configured languages, summaries, and a score in the expected shape. With a real model provider, it also checks expected categories, the presence of Arabic script, and a model-judged score. These checks can catch regressions, but they do not measure end-to-end search relevance or verify answer citations.',
        ],
      },
      {
        heading: 'Making runs inspectable and repeatable',
        paragraphs: [
          'I added OpenInference instrumentation to send graph and model-call traces to the local Phoenix service. Those traces include prompts, completions, model information, latency, and token usage. They help me investigate slow or unexpected runs and compare prompt or model changes. Because traces may contain article text or user queries, I treat their storage with the same care as the application data.',
          'To reproduce the system locally, configure the environment and start the Compose stack with make up. Meaningful translations, embeddings, and answers require credentials for a supported model provider. Stub chat and embedding providers allow a deterministic smoke run without API keys, but they do not produce meaningful translations or demonstrate semantic search quality. One command detail is easy to miss: make check runs lint with automatic fixes before type checks and tests, so it can modify files. For read-only checks, run make lint, make typecheck, and make test separately. Run make evals to compare graph behavior on the supplied examples; checks that call a real provider run only when one is selected.',
          'The design lesson I take from Wassla is to preserve the seams: make each transformation a named stage, store source and derived content separately, retrieve before generating, and keep evaluation and tracing close to the workflow. Those choices make the system easier to reproduce and improve. They do not turn generated text into verified journalism.',
        ],
      },
    ],
    references: [
      {
        title: 'Architecture and request flows',
        url: 'https://github.com/ali-ncibi/wassla-app/blob/main/docs/architecture.md',
      },
      {
        title: 'Article graph, prompts, and stages',
        url: 'https://github.com/ali-ncibi/wassla-app/tree/main/pipeline/app/graph',
      },
      {
        title: 'Database schema and persistence',
        url: 'https://github.com/ali-ncibi/wassla-app/blob/main/db/init/02_schema.sql',
      },
      {
        title: 'Vector search and answer generation',
        url: 'https://github.com/ali-ncibi/wassla-app/blob/main/pipeline/app/rag.py',
      },
      {
        title: 'Evaluation and observability workflow',
        url: 'https://github.com/ali-ncibi/wassla-app/blob/main/docs/observability.md',
      },
      {
        title: 'Setup and reproduction commands',
        url: 'https://github.com/ali-ncibi/wassla-app/blob/main/docs/quickstart.md',
      },
    ],
  },
  {
    slug: 'textual-representations-for-activity-recognition',
    title: 'How to make activity recognition transfer across homes',
    date: 'November 2026',
    category: 'Research note',
    readTime: '9 min read',
    excerpt:
      'A return to my PhD thesis: the problem I studied, the systems and experiments I built, and what I learned about activity recognition across homes.',
    intro:
      'A motion detector or door contact records events, not activities. Supervised human activity recognition can learn to infer activities from these signals, but it usually needs labeled examples from the home where it will be used. The intended deployment cannot assume those annotations are available. This thesis therefore studies source-target transfer: train on an annotated source dataset, such as a public smart-home dataset, and apply the model to an unannotated target home. My PhD work approaches that problem in two steps: make recognition experiments comparable with FlowAR, then test whether semantic descriptions of sensor events can support transfer.',
    coverImage: {
      url: '/covers/sensors-har.jpg',
      alt: 'Illustration of a sensor-equipped home connected to activity signals and machine-learning representations.',
      width: 1024,
      height: 768,
      mimeType: 'image/jpeg',
    },
    sections: [
      {
        heading: 'A sensor event is not an activity',
        paragraphs: [
          'Ambient binary sensors record changes such as a contact switch opening or a motion detector activating. A sequence of these events can provide evidence for an activity of daily living, but the activity is not directly observed. A recognition system must infer it from incomplete, noisy observations of interactions with rooms and objects.',
          'The deployment context in the thesis is aging in place. The HumansBox platform is intended to process sensor data locally on a secure embedded device and share summarized activity information, rather than raw streams. This makes privacy and limited computation part of the design problem. It is the motivating deployment context, not a field evaluation of the recognition methods described here.',
          'The engineering question is broader than which classifier to use: how can a recognition system be designed and evaluated so that it remains useful when the home, sensors, and amount of available annotation change?',
        ],
      },
      {
        heading: 'Why source-target transfer fits annotation scarcity',
        paragraphs: [
          'In ordinary supervised activity recognition, the training examples pair sensor segments with known activity labels. Collecting those labels requires observation or annotation in each deployment home, which is costly and may be impractical. The source-target alternative uses an already annotated source dataset for training and withholds target-home activity labels entirely. Public smart-home datasets can supply candidate source examples; the target is still a different environment, not simply another sample from the same home.',
          'That transfer creates a second problem. Sensor identifiers are local to an environment: a sensor called M12 in one dataset has no guaranteed relationship to M12 elsewhere. Homes also differ in room layout, sensor placement and density, resident routines, event rates, and annotation practice. A model may learn patterns that predict activities in its source home but depend on details that do not recur in the target. The thesis therefore connects two questions: how to make pipeline experiments comparable, and how to represent activity evidence so it can transfer without target annotations.',
        ],
      },
      {
        heading: 'First make experiments comparable: FlowAR',
        paragraphs: [
          'The first contribution is FlowAR (Flows of Activity Recognition), a modular framework for studying the pipeline as a whole. The thesis harmonizes 13 public datasets from CASAS, van Kasteren, Ordonez, ARAS, and Tapia. Their raw formats differ: some record sensor state changes as events, while others provide activation intervals. FlowAR converts them into a shared interval representation rather than assuming that each dataset uses the same file format or time convention.',
          'The harmonized data are stored as sensor and activity interval tables with start, end, and identifier fields. Timestamps use timezone-aware UTC values. For event-based sources, matching ON/OFF changes are paired into activation intervals. Unlabeled time gaps can be assigned the explicit Unknown label to make the temporal partition complete. Sensor metadata—such as type, attached object, and functional area—is curated and normalized where available.',
          'FlowAR then makes each decision in the recognition process a replaceable stage: segmentation creates temporal units; representation turns each unit into features; annotation assigns activity labels; classification predicts them; and evaluation measures the result. Shared interval semantics and a common dataset interface keep boundary rules consistent. Segments retain their time and event-index bounds, so later stages can be traced back to the original stream.',
          'This modularity matters because the stages interact. For example, the annotation rule can assign the activity with the greatest overlap, the activity active at the segment end, or every overlapping activity. Those choices change the task from single-label to multi-label classification and affect class balance. FlowAR also leaves sensor cleaning as an explicit choice: a long activation could be a faulty sensor, but it could also be evidence of a meaningful behavior.',
          'Evaluation is treated as more than a single score. FlowAR supports imbalance-aware metrics for model selection and temporal error analysis for diagnosis, including missed or inserted occurrences, fragmentation, merging, and boundary overfill or underfill. It implements leave-one-day-out evaluation, while the thesis notes that temporal dependence between days can still make ordinary cross-validation optimistic.',
          'A separate illustrative FlowAR experiment shows why this structure helps explain results. On Ordonez A and B, a decision tree used sensor-state features from segments between successive events. Adding the immediately previous segment raised the reported balanced, duration-aware F1 variant from 75.69% to 85.41% on A and from 55.34% to 69.65% on B. These figures describe that specific supervised setup; they are not cross-home transfer results.',
        ],
        code: {
          language: 'text',
          content:
            'sensor events and activity intervals\n' +
            '  -> harmonized time intervals and metadata\n' +
            '  -> segmentation -> representation -> annotation\n' +
            '  -> classification -> balanced scores and temporal error analysis',
        },
      },
      {
        heading: 'Then describe events in terms that can travel',
        paragraphs: [
          'A feature vector keyed by local sensor IDs can encode a home’s topology rather than the activity itself. The second contribution tests a different representation: use sensor metadata to describe what was observed in semantic terms, then embed that text and classify it. The overall path is textualization, embedding, classification. The experiment does not ask a generative language model to guess the activity; it uses text as a structured input to conventional classifiers.',
          'Textualizations expose different amounts of structure. Sequential schemes produce a description for each event and preserve event order. Summarized schemes compress a whole segment into one description. The thesis evaluates seven examples: basic and temporal event-by-event TDOST templates, two collapsed TDOST variants, the Civitarese narrative summary, the Dhekane structured summary, and a Compound Sensor Summary (CSS) designed for clause-level analysis.',
          'CSS combines observed sensor types, their functional areas, an event-token sequence, segment duration, and coarse time-of-day bounds. These attributes are not interchangeable. The event clause says what occurred; room and type clauses add context; duration and time bounds expose temporal context. Because they are separate clauses, they can be removed one at a time to test what helps or hurts transfer.',
          'The same text can be encoded with methods of different cost and capacity. The study compares source-fitted TF-IDF over unigrams and bigrams, 300-dimensional Google News skip-gram Word2Vec vectors pooled with TF-IDF weights fitted on source training data, and frozen all-distilroberta-v1 SBERT embeddings (768 dimensions). A 64-unit bidirectional LSTM handles sequential descriptions, with sequences padded or truncated to 100 events; a one-hidden-layer, 128-unit multilayer perceptron handles summaries. Both use Adam at 0.001, early stopping after 15 epochs, and a 20% validation split from the source training data. No embedding model is fine-tuned for the task.',
        ],
      },
      {
        heading: 'Build a test that isolates representation choices',
        paragraphs: [
          'The transfer study uses four harmonized homes: CASAS Aruba, CASAS Milan, Ordonez A, and Ordonez B. Each is limited to its first 14 days with activity annotations, and labels are pooled into a shared vocabulary. The datasets do not share every activity, so target scores are computed only for labels present in both source and target. The study reports results both with and without Unknown, whose meaning and frequency can vary between homes.',
          'Each public home serves in turn as the labeled source, with the other three as targets, giving 12 directed source-to-target pairs. Target annotations are withheld from training and model selection, then used only to score final predictions. This dataset-to-dataset experiment is a controlled proxy for deployment in a new home, not a field trial of the intended HumansBox system.',
          'Segmentation uses ground-truth activity boundaries. This oracle setup removes segmentation error so the experiment can focus on textualization and embedding; it is an upper-bound style analysis, not a test of a continuous deployed system. The seven textualizations and three embedding families form a 7-by-3 comparison. Source validation uses three-fold cross-validation; after selecting a configuration, it is retrained on the full source. Balanced accuracy is used to reduce the influence of class imbalance. Keeping segmentation, classifiers, and validation rules fixed makes the representation the main experimental variable. This is the key reproducibility lesson: define the transfer protocol and label semantics first, then vary the component whose effect you want to understand.',
        ],
      },
      {
        heading: 'The best representation depends on where it must work',
        paragraphs: [
          'Within a home, the sequential descriptions performed best across the tested embedding methods when Unknown was excluded. Event order and transition patterns were useful when training and test data came from the same environment. Across homes, the ranking often reversed: summarized descriptions transferred better, consistent with the explanation that they expose fewer home-specific timing and sequence patterns.',
          'In the analyses without Unknown, the textualization choice had a statistically significant main effect both in-domain (p = .006) and cross-domain (p = .001). The embedding model did not have a significant main effect in either setting, nor was there a significant interaction between textualization and embedding. When Unknown was included, none of these effects reached significance. The evidence therefore supports a bounded conclusion: in this experiment, how the segment was described mattered more than encoder capacity, especially in the cleaner shared-label analyses.',
          'The CSS ablation makes that design choice more concrete. Removing event tokens caused the largest drops, indicating that contextual descriptors cannot replace information about what happened. Conversely, in the cross-domain condition without Unknown, the best reduced CSS variant omitted time bounds and raised mean balanced accuracy from 0.662 to 0.712. Time-of-day cues can encode a resident’s routine, which may be useful at home but fragile elsewhere. The best ablation differed by condition, so this is not a universal instruction to remove time or room metadata.',
          'Adding Unknown lowered scores, particularly for cross-home evaluation, because it combines varied transitions and unmodeled behavior whose composition differs by dataset. The summarized schemes retained a relative advantage in many comparisons, but the statistical effects were no longer significant. Reporting only the easier closed-label result would hide this difficulty.',
        ],
      },
      {
        heading: 'What this work establishes—and what it leaves open',
        paragraphs: [
          'The main practical insight is not that text or a larger language model automatically solves domain shift. A textualization is a modeling decision: it controls which evidence a classifier can use. Event sequences can be valuable when the environment is stable and labeled; summaries can suppress some source-specific regularities when labels do not exist in the target. Lightweight embeddings remained competitive with the tested contextual model, making them an option when compute or memory is limited.',
          'The limits are important. Although FlowAR harmonizes 13 datasets, the transfer experiment covers four homes and only 14 annotated days from each. Sensor metadata are manually curated, and sensors without reliable metadata were removed in some datasets. Perfect activity boundaries were used, so realistic segmentation remains untested. Target predictions cover only activities shared with the source; the method does not solve open-set recognition. Results also depend on which source home is chosen.',
          'Finally, the thesis motivates local, resource-conscious processing but does not report a microcontroller benchmark or a long-term deployment evaluation. Further work needs realistic segmentation, more target homes, few-shot adaptation, uncertain metadata, sensor failures, behavioral drift, and activities that were not present in the source.',
          'For a new activity-recognition problem, a useful sequence is to normalize time and label semantics, record the metadata needed to interpret sensors, make segmentation and annotation rules explicit, and establish a source-to-target split before comparing models. Evaluate both the activity scores and the temporal shape of errors. Then vary the representation deliberately: retain event order when it is likely to transfer, or summarize it when home-specific timing may become a shortcut. That process is more informative than changing the classifier alone.',
        ],
      },
    ],
    relatedPublicationUrls: [
      'https://hal.science/hal-05401764v1',
      'https://hal.science/hal-05213603v1',
      'https://hal.science/hal-04944889v1',
      'https://theses.fr/2026UPASG027',
    ],
  },
]
