---
title: How to make activity recognition transfer across homes
date: '2026-11-15'
category: Research note
readTime: 9 min read
summary: 'A return to my PhD thesis: the problem I studied, the systems and experiments I built, and what I learned about activity recognition across homes.'
intro: 'A motion detector or door contact records events, not activities. Supervised human activity recognition can learn to infer activities from these signals, but it usually needs labeled examples from the home where it will be used. The intended deployment cannot assume those annotations are available. This thesis therefore studies source-target transfer: train on an annotated source dataset, such as a public smart-home dataset, and apply the model to an unannotated target home. My PhD work approaches that problem in two steps: make recognition experiments comparable with FlowAR, then test whether semantic descriptions of sensor events can support transfer.'
coverImage:
  url: /covers/sensors-har.jpg
  alt: Illustration of a sensor-equipped home connected to activity signals and machine-learning representations.
  width: 1024
  height: 768
  mimeType: image/jpeg
relatedPublicationUrls:
  - https://hal.science/hal-05401764v1
  - https://hal.science/hal-05213603v1
  - https://hal.science/hal-04944889v1
  - https://theses.fr/2026UPASG027
---

## A sensor event is not an activity

Ambient binary sensors record changes such as a contact switch opening or a motion detector activating. A sequence of these events can provide evidence for an activity of daily living, but the activity is not directly observed. A recognition system must infer it from incomplete, noisy observations of interactions with rooms and objects.

The deployment context in the thesis is aging in place. The HumansBox platform is intended to process sensor data locally on a secure embedded device and share summarized activity information, rather than raw streams. This makes privacy and limited computation part of the design problem. It is the motivating deployment context, not a field evaluation of the recognition methods described here.

The engineering question is broader than which classifier to use: how can a recognition system be designed and evaluated so that it remains useful when the home, sensors, and amount of available annotation change?

## Why source-target transfer fits annotation scarcity

In ordinary supervised activity recognition, the training examples pair sensor segments with known activity labels. Collecting those labels requires observation or annotation in each deployment home, which is costly and may be impractical. The source-target alternative uses an already annotated source dataset for training and withholds target-home activity labels entirely. Public smart-home datasets can supply candidate source examples; the target is still a different environment, not simply another sample from the same home.

That transfer creates a second problem. Sensor identifiers are local to an environment: a sensor called M12 in one dataset has no guaranteed relationship to M12 elsewhere. Homes also differ in room layout, sensor placement and density, resident routines, event rates, and annotation practice. A model may learn patterns that predict activities in its source home but depend on details that do not recur in the target. The thesis therefore connects two questions: how to make pipeline experiments comparable, and how to represent activity evidence so it can transfer without target annotations.

## First make experiments comparable: FlowAR

The first contribution is FlowAR (Flows of Activity Recognition), a modular framework for studying the pipeline as a whole. The thesis harmonizes 13 public datasets from CASAS, van Kasteren, Ordonez, ARAS, and Tapia. Their raw formats differ: some record sensor state changes as events, while others provide activation intervals. FlowAR converts them into a shared interval representation rather than assuming that each dataset uses the same file format or time convention.

The harmonized data are stored as sensor and activity interval tables with start, end, and identifier fields. Timestamps use timezone-aware UTC values. For event-based sources, matching ON/OFF changes are paired into activation intervals. Unlabeled time gaps can be assigned the explicit Unknown label to make the temporal partition complete. Sensor metadata—such as type, attached object, and functional area—is curated and normalized where available.

FlowAR then makes each decision in the recognition process a replaceable stage: segmentation creates temporal units; representation turns each unit into features; annotation assigns activity labels; classification predicts them; and evaluation measures the result. Shared interval semantics and a common dataset interface keep boundary rules consistent. Segments retain their time and event-index bounds, so later stages can be traced back to the original stream.

This modularity matters because the stages interact. For example, the annotation rule can assign the activity with the greatest overlap, the activity active at the segment end, or every overlapping activity. Those choices change the task from single-label to multi-label classification and affect class balance. FlowAR also leaves sensor cleaning as an explicit choice: a long activation could be a faulty sensor, but it could also be evidence of a meaningful behavior.

Evaluation is treated as more than a single score. FlowAR supports imbalance-aware metrics for model selection and temporal error analysis for diagnosis, including missed or inserted occurrences, fragmentation, merging, and boundary overfill or underfill. It implements leave-one-day-out evaluation, while the thesis notes that temporal dependence between days can still make ordinary cross-validation optimistic.

A separate illustrative FlowAR experiment shows why this structure helps explain results. On Ordonez A and B, a decision tree used sensor-state features from segments between successive events. Adding the immediately previous segment raised the reported balanced, duration-aware F1 variant from 75.69% to 85.41% on A and from 55.34% to 69.65% on B. These figures describe that specific supervised setup; they are not cross-home transfer results.

```text
sensor events and activity intervals
  -> harmonized time intervals and metadata
  -> segmentation -> representation -> annotation
  -> classification -> balanced scores and temporal error analysis
```

## Then describe events in terms that can travel

A feature vector keyed by local sensor IDs can encode a home’s topology rather than the activity itself. The second contribution tests a different representation: use sensor metadata to describe what was observed in semantic terms, then embed that text and classify it. The overall path is textualization, embedding, classification. The experiment does not ask a generative language model to guess the activity; it uses text as a structured input to conventional classifiers.

Textualizations expose different amounts of structure. Sequential schemes produce a description for each event and preserve event order. Summarized schemes compress a whole segment into one description. The thesis evaluates seven examples: basic and temporal event-by-event TDOST templates, two collapsed TDOST variants, the Civitarese narrative summary, the Dhekane structured summary, and a Compound Sensor Summary (CSS) designed for clause-level analysis.

CSS combines observed sensor types, their functional areas, an event-token sequence, segment duration, and coarse time-of-day bounds. These attributes are not interchangeable. The event clause says what occurred; room and type clauses add context; duration and time bounds expose temporal context. Because they are separate clauses, they can be removed one at a time to test what helps or hurts transfer.

The same text can be encoded with methods of different cost and capacity. The study compares source-fitted TF-IDF over unigrams and bigrams, 300-dimensional Google News skip-gram Word2Vec vectors pooled with TF-IDF weights fitted on source training data, and frozen all-distilroberta-v1 SBERT embeddings (768 dimensions). A 64-unit bidirectional LSTM handles sequential descriptions, with sequences padded or truncated to 100 events; a one-hidden-layer, 128-unit multilayer perceptron handles summaries. Both use Adam at 0.001, early stopping after 15 epochs, and a 20% validation split from the source training data. No embedding model is fine-tuned for the task.

## Build a test that isolates representation choices

The transfer study uses four harmonized homes: CASAS Aruba, CASAS Milan, Ordonez A, and Ordonez B. Each is limited to its first 14 days with activity annotations, and labels are pooled into a shared vocabulary. The datasets do not share every activity, so target scores are computed only for labels present in both source and target. The study reports results both with and without Unknown, whose meaning and frequency can vary between homes.

Each public home serves in turn as the labeled source, with the other three as targets, giving 12 directed source-to-target pairs. Target annotations are withheld from training and model selection, then used only to score final predictions. This dataset-to-dataset experiment is a controlled proxy for deployment in a new home, not a field trial of the intended HumansBox system.

Segmentation uses ground-truth activity boundaries. This oracle setup removes segmentation error so the experiment can focus on textualization and embedding; it is an upper-bound style analysis, not a test of a continuous deployed system. The seven textualizations and three embedding families form a 7-by-3 comparison. Source validation uses three-fold cross-validation; after selecting a configuration, it is retrained on the full source. Balanced accuracy is used to reduce the influence of class imbalance. Keeping segmentation, classifiers, and validation rules fixed makes the representation the main experimental variable. This is the key reproducibility lesson: define the transfer protocol and label semantics first, then vary the component whose effect you want to understand.

## The best representation depends on where it must work

Within a home, the sequential descriptions performed best across the tested embedding methods when Unknown was excluded. Event order and transition patterns were useful when training and test data came from the same environment. Across homes, the ranking often reversed: summarized descriptions transferred better, consistent with the explanation that they expose fewer home-specific timing and sequence patterns.

In the analyses without Unknown, the textualization choice had a statistically significant main effect both in-domain (p = .006) and cross-domain (p = .001). The embedding model did not have a significant main effect in either setting, nor was there a significant interaction between textualization and embedding. When Unknown was included, none of these effects reached significance. The evidence therefore supports a bounded conclusion: in this experiment, how the segment was described mattered more than encoder capacity, especially in the cleaner shared-label analyses.

The CSS ablation makes that design choice more concrete. Removing event tokens caused the largest drops, indicating that contextual descriptors cannot replace information about what happened. Conversely, in the cross-domain condition without Unknown, the best reduced CSS variant omitted time bounds and raised mean balanced accuracy from 0.662 to 0.712. Time-of-day cues can encode a resident’s routine, which may be useful at home but fragile elsewhere. The best ablation differed by condition, so this is not a universal instruction to remove time or room metadata.

Adding Unknown lowered scores, particularly for cross-home evaluation, because it combines varied transitions and unmodeled behavior whose composition differs by dataset. The summarized schemes retained a relative advantage in many comparisons, but the statistical effects were no longer significant. Reporting only the easier closed-label result would hide this difficulty.

## What this work establishes—and what it leaves open

The main practical insight is not that text or a larger language model automatically solves domain shift. A textualization is a modeling decision: it controls which evidence a classifier can use. Event sequences can be valuable when the environment is stable and labeled; summaries can suppress some source-specific regularities when labels do not exist in the target. Lightweight embeddings remained competitive with the tested contextual model, making them an option when compute or memory is limited.

The limits are important. Although FlowAR harmonizes 13 datasets, the transfer experiment covers four homes and only 14 annotated days from each. Sensor metadata are manually curated, and sensors without reliable metadata were removed in some datasets. Perfect activity boundaries were used, so realistic segmentation remains untested. Target predictions cover only activities shared with the source; the method does not solve open-set recognition. Results also depend on which source home is chosen.

Finally, the thesis motivates local, resource-conscious processing but does not report a microcontroller benchmark or a long-term deployment evaluation. Further work needs realistic segmentation, more target homes, few-shot adaptation, uncertain metadata, sensor failures, behavioral drift, and activities that were not present in the source.

For a new activity-recognition problem, a useful sequence is to normalize time and label semantics, record the metadata needed to interpret sensors, make segmentation and annotation rules explicit, and establish a source-to-target split before comparing models. Evaluate both the activity scores and the temporal shape of errors. Then vary the representation deliberately: retain event order when it is likely to transfer, or summarize it when home-specific timing may become a shortcut. That process is more informative than changing the classifier alone.
