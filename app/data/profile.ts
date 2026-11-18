export const profile = {
  name: 'Ali Ncibi',
  role: 'AI Engineer · PhD in Computer Science / AI',
  siteUrl: 'https://alincibi.page',
  avatarUrl: '/images/avatar.png',
  cvUrl: '/files/Ali Ncibi — CV.pdf',
  location: 'Île-de-France, France',
  availability: 'Available for opportunities',
  email: 'contact@alincibi.page',
  links: {
    github: 'https://github.com/ali-ncibi',
    linkedin: 'https://linkedin.com/in/ali-ncibi',
  },
  introduction:
    'I build machine-learning systems that move from careful research into reliable software. My work spans activity recognition, NLP, LLM infrastructure, and agentic applications.',
  experience: [
    {
      role: 'PhD Research Contract',
      organization: 'Inria',
      location: 'Saclay, France',
      dates: 'Dec 2022 – Jun 2026',
      summary:
        'Led R&D on AI-driven human activity recognition in smart environments, from heterogeneous sensor data to reproducible model evaluation.',
      highlights: [
        'Structured 13 public sensor datasets and built a containerised machine-learning pipeline.',
        'Evaluated classical, deep-learning, and text-based feature approaches with rigorous cross-validation.',
        'Benchmarked 7 event-transcription strategies and 3 embedding models; observed up to 30% better cross-domain recognition in specific settings.',
      ],
    },
    {
      role: 'Data / NLP Engineer',
      organization: 'SouthPigalle',
      location: 'Paris, France',
      dates: 'Nov 2021 – May 2022',
      summary:
        'Developed NLP components for a jewellery-shopping chatbot with data science and cloud teams.',
      highlights: [
        'Created a template-based slot-filling corpus and an interactive data-visualisation interface.',
        'Fine-tuned a BiLSTM-CRF tagger, exported it to ONNX, and containerised its inference API for production integration.',
        'Improved average balanced accuracy by 7% per tag.',
      ],
    },
    {
      role: 'NLP / Machine Learning Intern',
      organization: 'INSERM',
      location: 'Clamart, France',
      dates: 'Mar 2021 – Sep 2021',
      summary:
        'Worked with medical teams on clinical timeline reconstruction from medical reports.',
      highlights: [
        'Defined a temporal-relation annotation scheme and annotated reports.',
        'Built text-tagging and classification models for medical concepts and temporal relations.',
        'Developed an interactive patient-timeline visualisation tool.',
      ],
    },
  ],
  projects: [
    {
      title: 'Wassla',
      subtitle: 'AI-powered multilingual news platform',
      dates: 'Aug 2026 – Present',
      description:
        'A trilingual English, French, and Arabic news pipeline. LangGraph agents translate, categorize, summarize, and independently review articles before they reach an SSR reader with semantic search and citation-grounded answers.',
      technologies: ['LangGraph', 'LLMs', 'RAG', 'pgvector', 'Nuxt'],
      url: 'https://github.com/ali-ncibi/wassla-app',
    },
    {
      title: 'Self-hosted LLM platform',
      subtitle: 'Autoscaling inference on Kubernetes',
      dates: 'Sep 2026 – Present',
      description:
        'A reproducible, self-hosted LLM stack on OVH Managed Kubernetes with vLLM, Open WebUI, PostgreSQL/pgvector, Redis, and Prometheus/Grafana. Load tests validated scaling from one to three inference replicas.',
      technologies: ['Kubernetes', 'vLLM', 'PostgreSQL', 'Redis', 'Prometheus'],
      url: 'https://github.com/ali-ncibi/llm-stack',
    },
  ],
  publications: [
    {
      title:
        'Towards Domain-Robust Activity Recognition using Textual Representations of Binary Sensor Events',
      venue: '18th International Conference on Agents and Artificial Intelligence (ICAART)',
      location: 'Marbella, Spain · March 2026',
      url: 'https://hal.science/hal-05401764v1',
    },
    {
      title:
        'A Framework for Data-Driven Development of Human Activity Recognition Systems using Binary Sensors',
      venue:
        '21st International Conference on Distributed Computing in Smart Systems and the Internet of Things',
      location: 'Lucca, Italy · June 2025',
      url: 'https://hal.science/hal-05213603v1',
    },
    {
      title:
        'Une plateforme uniformisée pour la reconnaissance des activités humaines à partir de capteurs binaires',
      venue: '25e Conférence francophone Extraction et Gestion des Connaissances (EGC)',
      location: 'Strasbourg, France · January 2025',
      url: 'https://hal.science/hal-04944889v1',
    },
    {
      title:
        'Structured Data-Driven Pipelines and Evaluation of Semantic Representation Strategies for Cross-Home Human Activity Recognition from IoT Traces',
      venue: 'PhD thesis',
      location: 'Université Paris-Saclay · 2026',
      url: 'https://theses.fr/2026UPASG027',
    },
  ],
  education: [
    {
      degree: 'PhD in Computer Science / AI',
      institution: 'Université de Versailles–Saint-Quentin · Paris-Saclay',
      dates: '2022 – 2026',
      detail:
        'Research in machine learning, human activity recognition, and AI-driven data processing. Successfully defended 1 June 2026.',
    },
    {
      degree: 'Engineer in Data Science / AI',
      institution: 'Télécom Paris · Institut Polytechnique de Paris',
      dates: '2019 – 2021',
    },
    {
      degree: 'Engineer in IT & Telecommunications',
      institution: 'École Nationale d’Ingénieurs de Tunis',
      dates: '2017 – 2019',
    },
  ],
  skills: [
    {
      group: 'AI & machine learning',
      items: 'Machine learning · Deep learning · NLP · LLMs · Agentic systems · RAG · Evaluation',
    },
    {
      group: 'Frameworks & languages',
      items: 'Python · SQL · PyTorch · TensorFlow · scikit-learn · Hugging Face · LangGraph',
    },
    {
      group: 'Data & services',
      items: 'PostgreSQL · pgvector · FastAPI · Pandas · ONNX · OpenAI-compatible APIs',
    },
    {
      group: 'Infrastructure',
      items: 'Docker · Kubernetes · vLLM · GitHub Actions · Prometheus · Grafana · OpenTelemetry',
    },
  ],
  languages: ['French — bilingual', 'English — C1', 'Arabic — native'],
}
