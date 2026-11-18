---
title: Scaling LLM inference by watching the queue
date: '2026-11-17'
category: Engineering note
readTime: 9 min read
summary: How I tested queue-based scaling for self-hosted LLM inference on a small Kubernetes cluster, and what the results do—and do not—show.
intro: 'I built llm-stack to test a concrete operations question: can a small, CPU-only Kubernetes cluster run a self-hosted chat service and add inference capacity when requests begin to queue? To answer it, I had to look beyond the chat interface to model memory, cold starts, storage, and the signal that triggers scaling. This is a case study of that deployment, not a general capacity benchmark.'
coverImage:
  url: /covers/llm-stack.jpg
  alt: Illustration of an AI chat model monitored by metrics and served across Kubernetes nodes.
  width: 1024
  height: 768
  mimeType: image/jpeg
references:
  - title: Architecture, constraints, and production notes
    url: https://github.com/ali-ncibi/llm-stack/blob/main/README.md
  - title: Kubernetes services, storage, and autoscaling manifest
    url: https://github.com/ali-ncibi/llm-stack/blob/main/manifests/stack.yaml
  - title: Setup and secret-generation helper
    url: https://github.com/ali-ncibi/llm-stack/blob/main/stack.sh
  - title: Load-test phases and metrics watcher
    url: https://github.com/ali-ncibi/llm-stack/blob/main/loadtest/run.sh
  - title: Concurrent request generator
    url: https://github.com/ali-ncibi/llm-stack/blob/main/loadtest/gen.py
  - title: Optional Kubernetes Dashboard helper
    url: https://github.com/ali-ncibi/llm-stack/blob/main/dash.sh
  - title: Kubeconfig and secret ignore rules
    url: https://github.com/ali-ncibi/llm-stack/blob/main/.gitignore
---

## Start with the queue, not the interface

I began by tracing one chat request: the browser sends it to Open WebUI, the UI calls an OpenAI-compatible endpoint, and vLLM runs the model. When generation slows, requests collect at inference. Adding UI replicas might let the system accept and proxy more requests, but it does not necessarily shorten the model queue.

That led to my main hypothesis: in this deployment, the number of running and waiting inference requests is a more useful signal for scaling vLLM than CPU use in the UI. I do not treat that as a universal rule; another model server, workload, or bottleneck could need a different metric. I wanted to make the hypothesis testable on a deliberately small cluster.

The example uses three OVH MKS nodes, each described as 2 vCPU and 8 GiB of memory. On that budget, decisions that can be easy to overlook on a large GPU cluster—model size, shared memory, replica startup, and storage attachment—become central to the design.

## Fit the model to the node budget

Before adding replicas, I needed a model configuration that could run on one node. The deployment serves Qwen2.5-0.5B-Instruct with vLLM’s CPU image, bfloat16, an 8,192-token context limit, at most two sequences per engine, and a 512 MiB KV-cache allocation. Each pod requests 4 GiB of memory and has a 6 GiB limit; a memory-backed 1 GiB volume supplies /dev/shm. These settings describe this small CPU example, not tuning advice that applies to every model.

I also had to account for what the client sends. Open WebUI may include tool descriptions even with a short prompt, so part of a small context can be used before the conversation itself. The UI sends tool_choice: auto; vLLM is therefore configured for automatic tool choice with its Hermes parser. A small model and short output limits reduce the demo’s footprint, but also limit capability and answer quality. After observing slow CPU prefill, I set OMP_NUM_THREADS to 2. I also set VLLM_PORT explicitly because Kubernetes injects a variable with that name for a Service named vllm.

The lesson from this setup is to measure the serving process and tune context, concurrency, cache, shared memory, and CPU threads together. Increasing replicas without budgeting memory for each one can leave new pods Pending instead of adding usable capacity.

## Separate requests from scaling decisions

I kept the request path short. Open WebUI is the only service exposed through a cloud LoadBalancer, and it forwards model requests to the internal vLLM ClusterIP service at /v1. PostgreSQL with pgvector stores Open WebUI’s database and vector data. Redis provides the UI’s WebSocket manager; the manifest runs it as one replica without a persistent volume. These services support the application; they do not add model capacity.

I kept scaling on a separate control path. Prometheus scrapes vLLM’s /metrics endpoint every 10 seconds. KEDA queries Prometheus and changes the vLLM Deployment’s replica count. Since KEDA runs in another namespace, the scaler uses Prometheus’s fully qualified in-cluster DNS name. Grafana reads Prometheus through a provisioned data source and dashboard. It is a ClusterIP service, so the documented way to inspect it is with a local kubectl port-forward, not another public LoadBalancer.

This separation lets me reason about what happens: chat requests travel to inference, while metrics reach a controller that can change the number of inference pods. The manifest assumes kube-state-metrics is already available at a configured monitoring-service address; it does not install that dependency.

```text
REQUEST:  Browser → LoadBalancer → Open WebUI → vLLM → model
STATE:    Open WebUI → PostgreSQL/pgvector and Redis
CONTROL:  vLLM metrics → Prometheus → KEDA → vLLM replicas
INSPECT:  Prometheus → Grafana (internal service)
```

<figure>
  <video class="w-full rounded-md border-2 border-slate-900 bg-black dark:border-slate-700" controls preload="metadata" aria-label="LLM stack project walkthrough">
    <source src="/videos/ali-ncibi-llm-stack-explained.mp4" type="video/mp4">
    Your browser does not support embedded video.
  </video>
  <figcaption>LLM stack project walkthrough</figcaption>
</figure>

## Design storage around attachment limits

Storage shaped the design as much as compute. The managed cluster’s block storage is single-attach, and it does not provide a shared ReadWriteMany volume for pods on different nodes. PostgreSQL, Prometheus, and Grafana each use a 10 GiB ReadWriteOnce claim and one replica. Their Deployments use Recreate so the old pod stops before its replacement attaches the volume. This avoids an attachment conflict, but it does not provide high availability: a restart or node problem can interrupt these services.

For model files, I used a different approach. Each vLLM pod downloads the model into a size-limited emptyDir. That avoids requiring replicas to share storage the cluster cannot provide, but the cache disappears when the pod does. The model is about 1 GiB, and a new replica took roughly two to three minutes to start while downloading and loading it. That delay means the autoscaler can react to a queue long before the added capacity is ready.

Open WebUI’s local files also live in an emptyDir, with a separate copy for each pod. PostgreSQL and Redis coordinate parts of the application, but do not make those files shared. The production notes propose object storage instead. Before increasing replicas, I needed to distinguish data that must persist, data that can be rebuilt, and data that must be shared.

## Scale on the bottleneck, not a proxy

I configured KEDA’s ScaledObject to target vLLM and query Prometheus for the sum of running and waiting requests. The target threshold is 2; KEDA polls every 15 seconds, uses a 120-second scale-down cooldown, and keeps between one and three replicas. Because the metric includes both running and waiting work, I use it as a pressure signal, not as a direct measure of user-perceived latency. The minimum of one also means the model never scales to zero.

Open WebUI has its own HorizontalPodAutoscaler: one to five replicas, targeting 70% average CPU utilization. A PodDisruptionBudget keeps at least one UI pod available during voluntary disruptions such as node drains, but not during a node failure or application crash. In the recorded run, UI CPU stayed around 4–9% while vLLM scaled. That made UI CPU a poor signal for the inference bottleneck in this particular setup.

A queue signal only helps if it arrives early enough and new pods start before the backlog becomes unacceptable. Here, the Prometheus scrape interval, KEDA polling interval, cooldown, model download, and three-replica maximum all affect response time. I would choose thresholds from measured latency and startup behavior, not copy them as universal defaults. With a strict latency target, a warm spare, a higher minimum, a shared model cache, or an earlier signal may be more appropriate.

## Measure the whole request path

I wanted to observe the request and cluster together, rather than declare success because the scaler changed a replica count. The load-test scripts send concurrent requests through the chat API and record counts, status codes, latency percentiles, and throughput. A parallel watcher samples running and waiting requests, time to first token, end-to-end latency, replica counts, pending pods, and Kubernetes events every 15 seconds. Together, these signals help separate a slow model from a slow load balancer, a pod still waiting to start, or a scaler that has not reacted yet.

One saved run used repeated short “hi” prompts with a 16-token output limit. At concurrency 4, 97 of 100 requests succeeded; at 12, 200 of 210 succeeded. Both phases included disconnects near 50 seconds, consistent with the load balancer’s observed idle timeout. At concurrency 24, all 394 requests succeeded, throughput was 1.51 requests per second, and client-measured p95 latency was 23.3 seconds. During that phase, KEDA increased vLLM from one to three replicas while Open WebUI stayed at one.

I treat those numbers as evidence about one run, on this cluster, with this request shape. The generator is closed-loop: each worker sends another request after its previous one completes. Short prompts and a small output limit do not represent long-context conversations, diverse users, or production traffic. The result is not “this stack supports 24 users.” It is that the measurements show a bottleneck, the scaler reacting, and the latency and timeout limits that remain.

## Reproduce the demo, then harden it

To reproduce the experiment, I use a disposable cluster with permission to create the required resources. stack.sh installs KEDA if its custom resource definition is absent, generates local credentials when needed, creates a Kubernetes Secret, and applies the stack manifest. stack.sh check waits for pods to become ready; the first vLLM pod must download the model. The load-test runner then exercises baseline, increasing-concurrency, and cooldown phases and saves measurements and cluster state.

I treat the repository’s access helpers as demo tools, not production defaults. The public UI uses one plain-HTTP LoadBalancer, and the README describes first-user administrator setup. The load-test script assumes demo sign-in details, so I would replace them with a dedicated test account before running it outside an isolated environment. The optional Kubernetes Dashboard helper creates a cluster-admin ServiceAccount and a time-limited token; keep it local and temporary, and do not expose the dashboard. Keep kubeconfigs and generated credentials out of version control, and check the exact config filename against .gitignore before adding it to the repository.

For production, I would need more than a GPU image. The project’s migration notes call for TLS ingress and real identity controls, external secret management, pinned image versions, least-privilege access, durable and shared model and file storage, remote metrics with alerting, and tuning against the actual workload. The method I would carry forward is simpler: map the request and control paths, find the resource that queues, choose a signal close to that bottleneck, then test scale-up delay and user-visible latency with representative traffic.
