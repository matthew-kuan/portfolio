"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
// `m` is the tree-shakeable equivalent of `motion`; the animation feature set
// itself is fetched lazily (see loadMotionFeatures) so none of it sits in the
// initial bundle. Cards render immediately and gain animation once it lands.
import { LazyMotion, m, AnimatePresence } from "framer-motion";

const loadMotionFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

// three.js is ~150 kB and purely decorative, so keep it out of the initial bundle
// and off the server render so it never blocks first paint.
const ThreeBackground = dynamic(() => import("./ThreeBackground"), {
  ssr: false,
  loading: () => null,
});

// Also client-only and three.js-backed, loads on demand, not at first paint.
const MicrofluidicChip = dynamic(() => import("./MicrofluidicChip"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-2xl border border-slate-200 dark:border-neutral-700 grid place-items-center text-slate-400 dark:text-neutral-400 text-sm">
      Loading interactive model…
    </div>
  ),
});

// ─── DATA ─────────────────────────────────────────────────────────────────────

// ─── EDIT ME ──────────────────────────────────────────────────────────────────
// Drives the availability line in the hero. Flip `available` to false and the
// pill switches to a neutral "not seeking" state automatically.
const CURRENTLY = {
  available: true,
  seeking: "Summer 2027 internships",
};
// ──────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Research", href: "#research" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Coursework", href: "#coursework" },
  { label: "Contact Information", href: "#contact" },
];

const RESEARCH = [
  {
    org: "Microfluidics for Quantitative and Genomics Biology Lab",
    sub: "Stony Brook University",
    role: "Research and Development Engineer + Project Lead",
    date: "Aug 2025 – Present",
    bullets: [
      "Designed and fabricated thermoplastic dPCR partitioning devices using multilayer SU-8 photolithography, hot embossing, and UV-curable adhesive bonding as a cost-effective alternative to conventional PDMS fabrication.",
      "Diagnosed and resolved fabrication failures, such as non-uniform imprints and restricted liquid flow, by implementing a custom leveling apparatus during oven curing and bracing the substrate against lateral spreading.",
      "Evaluated device performance using brightfield and fluorescent microscopy to assess partitioning efficiency and fabrication quality; performed contact angle measurements using DI water, NOA72, and NEA121RED on native and plasma-treated polycarbonate surfaces, analyzed with ImageJ to characterize adhesive wettability.",
      "Executed quality control audits using brightfield macroscopic imaging to assess microstructure integrity, functional reliability, and dimensional consistency across fabrication batches.",
      "Streamlined device synthesis workflows and process development protocols, improving production yield and structural consistency across fabrication cycles.",
      "Engineered complex testing devices to investigate cellular heterogeneity and support high-throughput, scalable experiments aligned with new development protocols.",
      "Onboarded and mentored an incoming lab member on fabrication protocols, organizational practices, and systematic troubleshooting approaches, reinforcing research continuity across semester transitions.",
      "Maintained comprehensive records in alignment with laboratory data standards, contributing to reproducible and auditable research documentation.",
    ],
    tags: ["Microfluidics", "dPCR", "Photolithography", "ImageJ", "Cleanroom"],
  },
  {
    org: "Low-Intensity Vibration (LIV) Lab",
    sub: "Stony Brook University",
    role: "Data Analyst",
    date: "Jan 2025 – May 2025",
    bullets: [
      "Developed a Frequency and Amplitude Modulated Sweep (FAMS) vibration signal to model physiologically relevant mechanical stimuli (20\u201350 Hz) for T-cell proliferation studies supporting CAR-T biomanufacturing.",
      "Engineered and validated a LabVIEW-controlled LIV device integrating an Arduino microcontroller, linear voice-coil actuator, and tri-axis accelerometer to generate custom bilateral sweep signals (0\u201335 Hz).",
      "Built a Python-based quality-control analytics pipeline (pandas, NumPy, SciPy, Plotly, enDAQ) to verify laboratory device sweep signal frequency accuracy, detect noise artifacts, compute acceleration, and flag deviations.",
      "Collaborated with a multidisciplinary team to streamline validation workflows by proposing real-time acceleration feedback integration (PID), eliminating manual data export steps, and supporting experimental timelines.",
      "Compiled experimental findings into comprehensive research reports and poster presentations; delivered concise project updates during weekly cross-functional lab meetings and reviewed relevant literature and lab documentation.",
      "Analyzed accelerometer data to identify oscillation artifacts at higher frequencies (36\u201350 Hz), informing hardware and software redesign for improved signal stability.",
      "Prepared experimental plans for upcoming in vitro T-cell stimulation studies, aligning FAMS signal parameters with prior foundational research on LIV-induced proliferation.",
      "Managed lab data practices for quantifying cell proliferation, gene expression, and protein assays, adhering to research standards to ensure data integrity and organized documentation.",
      "Performed primary cell culture in sterile conditions, recording microscopic imaging observations and evaluating experimental results through ELISA and Western Blotting protein assays.",
      "Explored Oxford Nanopore Technologies\u2019 EPI2ME platform and wf-teloseq Nextflow workflow to assess feasibility of telomere-length sequencing as a biomarker readout for LIV-stimulated T-cell studies.",
    ],
    tags: ["Python", "LabVIEW", "Arduino", "SciPy", "Signal Processing"],
  },
  {
    org: "Aquatic Research Environmental Assessment Center",
    sub: "Brooklyn College",
    role: "Research Intern",
    date: "Jul 2023 – Sep 2023",
    bullets: [
      "Analyzed qualitative and quantitative organism data to assess chemical exposure effects on aquatic ecosystems.",
      "Administered controlled chemical treatments and coordinated experimental procedures with a research team.",
      "Completed coursework in scientific principles, laboratory research methods, and data analysis techniques.",
      "Represented the research group in a poster presentation at the NYCSRM Consortium at the American Museum of Natural History.",
    ],
    tags: ["Data Analysis", "Environmental Science"],
  },
];

const EXPERIENCE: {
  org: string;
  sub: string;
  role: string;
  date: string;
  location: string;
  bullets: string[];
  tags: string[];
  links?: { label: string; href: string }[];
}[] = [
  {
    org: "Nature\u2019s Finest Security, LLC",
    sub: "Business Development & Marketing",
    role: "Intern",
    date: "Jul 2026 \u2013 Aug 2026",
    location: "New York, NY",
    bullets: [
      "Organize and maintain the company\u2019s sales pipeline in HubSpot CRM, auditing six months of submitted proposals and assigning each opportunity to its correct deal stage, enabling accurate visibility into business performance.",
      "Produce and publish 4\u20138 AI-generated marketing advertisements per week using Zeely AI, coordinating budget allocation with management prior to launch.",
      "Execute B2B social media marketing across TikTok, Instagram, and Facebook on a consistent publishing cadence promoting security services and recruitment.",
      "Run a customer review campaign targeting 20+ new Google Reviews, monitoring activity and pacing submissions to sustain organic growth.",
    ],
    tags: ["HubSpot CRM", "Business Development", "Digital Marketing", "Pipeline Analytics"],
  },
  {
    org: "Residential Safety Program (RSP)",
    sub: "Stony Brook University",
    role: "Safety Operations Assistant",
    date: "Feb 2026 \u2013 May 2026",
    location: "Stony Brook, NY",
    bullets: [
      "Draft detailed incident reports and proactively identify operational and security concerns to safeguard 10,000+ campus residents, demonstrating strong written communication and meticulous attention to detail.",
      "Coordinate with emergency dispatch and leadership to resolve incidents efficiently, maintaining reliable operational continuity during high-pressure events and adhering to safety protocols in high-density residential zones.",
    ],
    tags: ["Operations", "Communication", "Documentation"],
  },
  {
    org: "Goldman Sachs Emerging Leaders Series",
    sub: "Engineering Division",
    role: "Engineering Division Participant",
    date: "Jan 2026 \u2013 Apr 2026",
    location: "Dallas, TX",
    bullets: [
      "Engineered a full-stack mutual fund investment predictor using Java Spring Boot and Angular, developing RESTful APIs to compute projected investment returns from historical data, U.S. Treasury rates, and AI models.",
      "Collaborated with Goldman Sachs engineers to design, test, and present an in-person capstone showcasing an interactive, user-friendly website that visualizes expected returns and risk profiles for end-users.",
      "Analyzed complex financial datasets to optimize portfolio decision-making frameworks using robust data structures, synthesizing findings into a cumulative presentation on a scalable solution for management directors.",
      "Integrated Yahoo Finance API for 5-year historical returns, FRED Treasury API for risk-free rates and term/credit factors, and Newton Analytics API for beta calculations across 48 mutual funds and 20 bond funds.",
      "Built an interactive fund selection with category filtering, search, and risk-level indicators; implemented principal input validation, year selection, and year-by-year growth visualization with bar charts and data tables.",
      "Seeded a Postgres database with bond fund regression coefficients computed via a Python script fetching from Yahoo Finance; cached live Newton Analytics beta values and FRED risk-free rates to minimize redundant API calls.",
      "Added an AI chatbot using the Gemini API with tool-calling to fetch live expected returns and future value projections for user-specified funds, enforcing recommendation guardrails and risk explanations.",
      "Built JUnit tests validating that future-value computations return the correct number of time-period entries and produce positive, finite results across all fund categories.",
    ],
    tags: ["Java", "Spring Boot", "Angular", "Python", "PostgreSQL", "Gemini API"],
    links: [{ label: "Mutual Fund Calculator", href: "/projects/mutual-fund-calculator.pdf" }],
  },
  {
    org: "Project Destined",
    sub: "Real Estate Private Equity Program",
    role: "Real Estate Private Equity Intern",
    date: "Jan 2026 \u2013 Mar 2026",
    location: "Remote",
    bullets: [
      "Developed a 10-year financial forecast model for a $6.5M, 28-unit multifamily acquisition projecting a $12.7M terminal value; structured $7.0M+ in capital sources, including debt sizing, amortization, and equity optimization.",
      "Synthesized market data and quantitative analysis into an investment memo pitched to senior executives, communicating risk-return trade-offs and capital structure rationale in a clear, structured narrative.",
    ],
    tags: ["Financial Modeling", "Real Estate", "Excel"],
    links: [
      { label: "Levered Returns Pager", href: "/experience/project-destined-pager.pdf" },
      {
        label: "Certificate",
        href: "https://certificates.projectdestined.com/credentials/1425608d-a330-4131-b53a-867041192574?recipient=true",
      },
    ],
  },
  {
    org: "Rendr Internal Medicine",
    sub: "Private Practice",
    role: "Shadowing & Medical Intern",
    date: "Jul 2024 \u2013 Jan 2026",
    location: "New York, NY",
    bullets: [
      "Directed patients and families to appropriate departments, responded to a high volume of walk-in inquiries with professionalism, and coordinated referrals across specialties.",
      "Monitored patient health conditions in the waiting room and reported significant changes in patient status to providers, facilitating care continuity and efficient patient flow.",
      "Scheduled follow-up appointments and developed a working understanding of clinical workflows, diagnostic procedures, and patient care approaches from the provider\u2019s perspective.",
    ],
    tags: ["Clinical", "Patient Care", "Healthcare"],
  },
];

type ProjectTag = "All" | "SWE" | "AI/ML" | "Biomedical" | "Finance" | "Hardware" | "Energy" | "Research";

const PROJECTS: {
  name: string;
  /** One-line outcome shown above the technical bullets. */
  impact: string;
  stack: string;
  context: string;
  bullets: string[];
  tags: ProjectTag[];
  pdf?: string;
  pdfLabel?: string;
  repo?: string;
  demo?: string;
  extra?: { label: string; href: string };
}[] = [
  {
    name: "Mutual Fund Investment Predictor",
    impact: "Full-stack return model over live market data, covering 48 mutual funds and 20 bond funds.",
    stack: "Java · Spring Boot · Angular · PostgreSQL · Python · Gemini API",
    context: "Emerging Leaders Series Capstone, 2026",
    bullets: [
      "Built RESTful APIs that project investment returns from historical performance, U.S. Treasury rates, and fund-level risk factors, then surface expected value and risk profile through an Angular front end.",
      "Integrated Yahoo Finance for 5-year historical returns, the FRED Treasury API for risk-free rates and term/credit factors, and Newton Analytics for beta, caching live values in Postgres to cut redundant API calls.",
      "Seeded bond fund regression coefficients with a Python job, and added a Gemini tool-calling chatbot that fetches live expected returns and future value projections under explicit recommendation guardrails.",
      "Covered the math with JUnit tests asserting that future-value computations return the correct number of periods and stay positive and finite across every fund category.",
    ],
    tags: ["Finance", "SWE", "AI/ML"],
    pdf: "/projects/mutual-fund-calculator.pdf",
  },
  {
    name: "Habits: Sleep Quality Tracker",
    impact: "A live, revenue-ready product: Stripe billing, Supabase backend, and a React Native app.",
    stack: "Next.js \u00b7 TypeScript \u00b7 Supabase \u00b7 Stripe \u00b7 Expo (React Native) \u00b7 CSS",
    context: "Personal Project",
    bullets: [
      "Built a full-stack sleep-wellness app that quantifies sleep debt on a rolling 14-day ledger, estimates a personalized melatonin wind-down window from logged habits, and correlates daily energy ratings against accumulated debt.",
      "Implemented a freemium model with Stripe subscription billing (checkout, webhooks, and billing portal) over a Supabase Postgres backend with authentication and SQL migrations.",
      "Shipped a companion Expo / React Native mobile app with automated over-the-air deployments via an EAS Update GitHub Actions pipeline triggered on each push.",
    ],
    tags: ["SWE", "Biomedical"],
    demo: "https://habits-zeta-nine.vercel.app/",
    repo: "https://github.com/s3raphsembrace/habits",
  },
  {
    name: "Multi-Modal Evidence Review",
    impact: "Placed #85 of 1,773 by cutting per-claim cost to ~$0.001 with a two-stage vision pipeline.",
    stack: "Gemini API SDK \u00b7 PyYAML \u00b7 Pillow \u00b7 tenacity \u00b7 tqdm",
    context: "HackerRank Orchestrate 2026 \u00b7 #85 / 1773",
    bullets: [
      "Built a two-stage multimodal pipeline (Google Gemini vision) to adjudicate insurance-style damage claims across cars, laptops, and packages, classifying image evidence as supporting, contradicting, or insufficient.",
      "Designed a cheap Stage-1 validity gate (Flash-Lite) that screens for blur, wrong-object, and quality issues before triggering expensive Stage-2 analysis, cutting cost to ~$0.001/claim while improving flag reliability.",
      "Engineered object-specific prompts with injected evidence rubrics and user-history risk context, plus a closed-vocabulary normalizer and evaluation harness (macro-F1, confusion matrix) scored against labeled data.",
    ],
    tags: ["AI/ML", "SWE"],
    repo: "https://github.com/s3raphsembrace/orchestrate",
  },
  {
    name: "Sprout",
    impact: "AI recovery-support app with encrypted health data, pitched to a panel of healthcare judges.",
    stack: "React \u00b7 Vite \u00b7 Node.js \u00b7 Express \u00b7 PostgreSQL \u00b7 OpenAI",
    context: "Healthcare Innovation Challenge 2026",
    bullets: [
      "Built a full-stack web app using AI to personalize daily recovery micro-tasks for users with substance use disorder, converting mood check-ins and journal entries into actionable interventions via the OpenAI API.",
      "Designed a relapse-risk classification system that analyzes mood, cravings, sleep quality, and journal sentiment in real time to surface targeted recovery actions.",
      "Implemented JWT-based authentication and a RESTful Express/PostgreSQL backend with row-level data security to protect sensitive health information.",
      "Presented to a panel of healthcare judges, competing on feasibility, scientific rigor, and public health impact.",
    ],
    tags: ["SWE", "AI/ML", "Biomedical"],
    pdf: "/projects/sprout.pdf",
    repo: "https://github.com/env1ou5/rehabilitatetomodachi2",
  },
  {
    name: "Mon Sillage",
    impact: "AI fragrance recommender with a circular-packaging model, presented at L\u2019Or\u00e9al Brandstorm.",
    stack: "Next.js \u00b7 React \u00b7 Tailwind CSS \u00b7 Google Gemini API",
    context: "L\u2019Or\u00e9al Brandstorm 2026",
    bullets: [
      "Developed an AI-powered personalized fragrance recommendation web app integrating the Google Gemini API to analyze user outfit images, local weather, and personal preferences, delivering scent recommendations and application guidance.",
      "Designed a multi-step discovery journey (location, climate, personality, and sillage inputs) using Next.js and Tailwind CSS to deliver a premium, bespoke digital consultation experience.",
      "Conceptualized a circular business model featuring refillable aluminum-shell fragrance vessels and a seasonal scent cadence using PCR glass (reducing CO\u2082 up to 30%), aligning with L\u2019Or\u00e9al\u2019s 2030 sustainability goals.",
      "Presented product strategy and tech architecture to panel judges, positioning Savoir-Faire as a \u201cbeauty tech\u201d brand combining AI-driven personalization with sustainability-first hardware design.",
    ],
    tags: ["SWE", "AI/ML"],
    pdf: "/projects/mon-sillage.pdf",
    repo: "https://github.com/s3raphsembrace/mon-sillage",
    demo: "https://mon-sillage.vercel.app/",
  },
  {
    name: "Guitarverse",
    impact: "Real-time pitch detection and 3D tab rendering in the browser, shipped at a hackathon.",
    stack: "Next.js \u00b7 MongoDB \u00b7 Docker \u00b7 NextAuth \u00b7 Demucs \u00b7 basic-pitch",
    context: "HopperHacks WiCS 2026",
    bullets: [
      "Built a gamified, full-stack guitar practice platform with real-time pitch detection, MIDI file import, and 3D tab visualization using Three.js and React Three Fiber, enabling users to practice along with animated guitar notation.",
      "Implemented real-time audio processing using the Web Audio API and basic-pitch for pitch accuracy feedback; integrated Demucs for audio stem separation via a Dockerized Python backend, enabling dependency-free client-side usage.",
      "Developed user authentication (NextAuth), profile management, campaign modes, and a competitive leaderboard using MongoDB, fostering a social and structured practice ecosystem.",
      "Containerized the audio import service with Docker, pre-warming the Demucs model at startup and caching checkpoints in a persistent volume, to eliminate manual dependency installation for contributors.",
    ],
    tags: ["SWE"],
    repo: "https://github.com/aycow/guitar_site",
    demo: "https://guitar-site-zeta.vercel.app",
  },
  {
    name: "Surgical Application Hand-Tracking Robotic Arm",
    impact: "Hands-free robotic control from webcam hand tracking, with per-joint safety validation.",
    stack: "Fusion 360 \u00b7 Arduino \u00b7 C++ \u00b7 Python \u00b7 MediaPipe",
    context: "Emergent Biodesign 2026",
    bullets: [
      "Designed and 3D printed custom human-finger-inspired gripper modules in Fusion 360 and Meshmixer, resolving repeated print failures caused by filament instability and structural fracturing through iterative redesign.",
      "Programmed Arduino firmware in C++ to initialize the Braccio arm to a calibrated safe position, parse six-joint angle commands from serial input, validate each value against a safety table, and execute incremental 3\u00b0 motion steps with inter-step delays to prevent mechanical strain.",
      "Built a Python vision-control pipeline using MediaPipe to capture real-time webcam feed, identify bilateral hand landmarks, and map right-hand pose to arm joint angles and left-hand pose to gripper open/close commands.",
      "Benchmarked design against four existing control paradigms; differentiated solution by eliminating pre-programmed motion sequences and preserving continuous surgeon judgment in the control loop.",
      "Delivered a 10-minute live in-class demonstration of real-time surgical tool grasping, arm calibration, and safe reset; presented circuit schematics, firmware architecture, and vision pipeline to peer and faculty reviewers.",
    ],
    tags: ["Hardware", "AI/ML", "Biomedical"],
    pdf: "/projects/braccio-arm.pdf",
    repo: "https://github.com/s3raphsembrace/mediapipe-braccio-control",
    demo: "/demo/braccio",
  },
  {
    name: "Dog Treat Dispenser",
    impact: "Accessible one-push dispenser for users with limited hand mobility, toleranced to 0.15 mm.",
    stack: "Fusion 360 \u00b7 AutoCAD",
    context: "Emergent Biodesign, Spring 2026",
    bullets: [
      "Designed a spur gear-based dispensing mechanism for wheelchair users with limited hand mobility, applying kinematic calculations to determine pitch diameter (4.0 in), diametral pitch (6), and tooth count (24).",
      "Produced annotated orthographic projections, assembly drawings, and motion simulations in Fusion 360; applied interference analysis to identify collisions and used offset face tolerancing to establish a 0.15 mm clearance fit.",
      "Ran parametric modeling with driven dimensions to dynamically link treat size constraints to gear geometry, enabling automatic recalculation of housing clearances when design parameters changed.",
    ],
    tags: ["Hardware", "Biomedical"],
    pdf: "/projects/dog-treat-dispenser.pdf",
  },
  {
    name: "AI & The Environment Research Paper",
    impact: "Research assessing where AI genuinely reduces energy demand versus where it adds to it.",
    stack: "Research Writing \u00b7 Energy Policy \u00b7 Sustainability Analysis",
    context: "Intermediate Writing (WRT 102), Spring 2025",
    bullets: [
      "Authored a research-based argumentative paper evaluating whether artificial intelligence can reduce net environmental harm, weighing the energy cost of AI runtime against its capacity to cut global consumption.",
      "Analyzed AI\u2019s role in siting and scaling renewable energy, including offshore wind capacity assessment, and in operating energy plants more efficiently, drawing on peer-reviewed engineering and environmental sources.",
      "Evaluated real siting constraints for renewable installations, including average wind speeds, geotechnical foundation conditions, coastal biodiversity impact, and project economics, then peer-reviewed essays across other disciplines to refine argumentation and structure.",
    ],
    tags: ["Energy", "Research", "AI/ML"],
    pdf: "/projects/wrt-energy-ai-portfolio.pdf",
    pdfLabel: "Portfolio",
  },
  {
    name: "Principal Component Analysis Neural Network",
    impact: "Dimensionality reduction and clustering pipeline for pattern recognition on complex datasets.",
    stack: "Python \u00b7 NumPy \u00b7 Matplotlib \u00b7 Pandas",
    context: "Personal Project",
    bullets: [
      "Interpreted datasets using advanced computational methodologies, implementing DBSCAN and K-means clustering algorithms with heat-mapping visualizations to perform pattern recognition and validate data accuracy.",
      "Developed a Principal Component Analysis (PCA) program to streamline data interpretation and accurately isolate significant data regions.",
    ],
    tags: ["AI/ML", "Research"],
  },
  {
    name: "Noninvasive Heart Rate Sensor",
    impact: "Led a 7-person team to a working wearable prototype; won Best Presentation.",
    stack: "C++ \u00b7 Arduino \u00b7 Fusion 360",
    context: "Intro to Biomedical Engineering, Fall 2024",
    bullets: [
      "Authored technical documentation and delivered project presentations, earning the \u201cBest Presentation Award\u201d for exceptional communication, critical thinking, and clearly explaining the design process to non-technical audiences.",
      "Directed a 7-person team through an iterative project lifecycle, researching hypoallergenic, cost-efficient design materials, project requirements, constraints, and product design while managing timelines.",
      "Designed, assembled, and systematically troubleshot electronic hardware components to prototype a noninvasive wearable sensor, actively evaluating factors that impacted product performance, safety, and manufacturability.",
    ],
    tags: ["Hardware", "Biomedical"],
    pdf: "/projects/heart-rate-sensor.pdf",
    demo: "https://you.stonybrook.edu/heartratesensor/the-topic-and-goal/",
  },
  {
    name: "Probiotic Neoantigen Delivery for Cancer Immunotherapy",
    impact: "Engineered a probiotic delivery route for tumor neoantigens, grounded in Nature literature.",
    stack: "Synthetic Biology \u00b7 Recombinant DNA Design \u00b7 SnapGene",
    context: "BME 304 / BME 300 \u00b7 Stony Brook University",
    bullets: [
      "Investigated engineering probiotic E. coli Nissle 1917 within the gut microbiome to deliver tumor-specific neoantigens and enhance cancer immunotherapy outcomes, working in a team of six.",
      "Modeled recombinant plasmid construction incorporating tumor-targeting vectors, a pBAD inducible promoter, and listeriolysin O sequences; authored an accompanying critical analysis grounded in peer-reviewed Nature literature.",
    ],
    tags: ["Biomedical", "Research"],
    pdf: "/projects/neoantigen-presentation.pdf",
    extra: { label: "Paper", href: "/projects/neoantigen-critical-analysis.pdf" },
  },
  {
    name: "Acidosis & Bone Mechanical Strength Study",
    impact: "Measured a statistically significant 15% drop in bone force-to-failure (p = 0.009).",
    stack: "INSTRON UTM \u00b7 IBM SPSS \u00b7 Statistical Analysis",
    context: "BME 212 \u00b7 Stony Brook University",
    bullets: [
      "Designed and executed an ex vivo three-point bending study on 20 matched-pair specimens to quantify how acidic pH affects bone structural integrity, conducting a power analysis to justify sample size.",
      "Applied paired t-test analysis in IBM SPSS to establish a statistically significant 15% reduction in force-to-failure (p = 0.009); documented methodology and findings in a formal paper and group presentation.",
    ],
    tags: ["Biomedical", "Research"],
    pdf: "/projects/bone-acidosis-paper.pdf",
    pdfLabel: "Paper",
    extra: { label: "Slides", href: "/projects/bone-acidosis-presentation.pdf" },
  },
  {
    name: "Narcolepsy Monitoring Headband",
    impact: "Wearable EEG concept for pediatric narcolepsy, co-designed with a fine arts student.",
    stack: "Fusion 360 \u00b7 AutoCAD \u00b7 EEG Concept Design",
    context: "ART \u00d7 BME Interdisciplinary Design 2026",
    bullets: [
      "Collaborated with a fine arts student to prototype a wearable EEG-based pediatric narcolepsy monitoring headband in Fusion 360, iterating on a non-circular 20 cm profile to resolve sizing and geometry failures across print cycles.",
      "Proposed integration of EEG electrodes, signal amplifiers, Bluetooth modules, and onboard storage for real-time brainwave monitoring and wireless transmission to a caregiver companion app.",
    ],
    tags: ["Hardware", "Biomedical"],
    pdf: "/projects/narcolepsy-headband.pdf",
  },
];

const SKILLS: Record<string, string[]> = {
  "Languages": ["Python", "Java", "TypeScript", "JavaScript", "HTML5", "CSS3", "SQL", "C", "C++", "LabVIEW"],
  "Frameworks & Libraries": ["React", "Next.js", "Node.js", "Express", "Spring Boot", "Angular", "Tailwind CSS", "Pandas", "NumPy", "Jupyter"],
  "Cloud & Data": ["AWS", "Docker", "Git", "MongoDB", "PostgreSQL"],
  "Design & Tools": ["Fusion 360", "AutoCAD", "CHITUBOX", "Bambu Studio", "Canva", "Adobe Express", "Photoshop", "IBM SPSS"],
};

// Maps a skill/tech name → Devicon icon path (served from jsDelivr CDN).
// Anything not listed simply renders without a logo.
const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";
const ICON_MAP: Record<string, string> = {
  "Python": "python/python-original",
  "Java": "java/java-original",
  "TypeScript": "typescript/typescript-original",
  "JavaScript": "javascript/javascript-original",
  "HTML5": "html5/html5-original",
  "CSS3": "css3/css3-original",
  "C": "c/c-original",
  "C++": "cplusplus/cplusplus-original",
  "React": "react/react-original",
  "Next.js": "nextjs/nextjs-original",
  "Node.js": "nodejs/nodejs-original",
  "Express": "express/express-original",
  "Spring Boot": "spring/spring-original",
  "Angular": "angular/angular-original",
  "Tailwind CSS": "tailwindcss/tailwindcss-original",
  "Pandas": "pandas/pandas-original",
  "NumPy": "numpy/numpy-original",
  "SciPy": "scipy/scipy-original",
  "Scikit-learn": "scikitlearn/scikitlearn-original",
  "Jupyter": "jupyter/jupyter-original",
  "AWS": "amazonwebservices/amazonwebservices-original-wordmark",
  "Docker": "docker/docker-original",
  "Git": "git/git-original",
  "MongoDB": "mongodb/mongodb-original",
  "PostgreSQL": "postgresql/postgresql-original",
  "Matplotlib": "matplotlib/matplotlib-original",
  "Three.js": "threejs/threejs-original",
  "Canva": "canva/canva-original",
  "Photoshop": "photoshop/photoshop-plain",
};

function iconUrl(name: string): string | null {
  return ICON_MAP[name] ? `${DEVICON}/${ICON_MAP[name]}.svg` : null;
}

const MARQUEE_SKILLS = ["Python", "React", "Next.js", "TypeScript", "Java", "Spring Boot", "PostgreSQL", "Docker", "MongoDB", "SciPy", "Three.js", "Tailwind CSS", "Node.js", "Git", "Angular"];

const POSTERS = [
  { title: "Developing a Thermoplastic Device Capable of Partitioning Samples for dPCR", venue: "SBU URECA Symposium, 2026", pdf: "/posters/dpcr-thermoplastic-poster.pdf" },
  { title: "A Piezoelectric-Driven High-Throughput Microfluidic Platform for Optimizing Biomanufacturing for Cell-Based Immunotherapy", venue: "VIP Program Symposium, 2026", pdf: "/posters/piezoelectric-microfluidic-poster.pdf" },
  { title: "Generation & Validation of a Mechanical Bidirectional Sweep Signal to Bolster Human T-Cell Proliferation for Cancer Immunotherapy", venue: "VIP Program Symposium, 2025", pdf: "/posters/sweep-signal-poster.pdf" },
];

// Course descriptions are quoted/condensed from the Stony Brook University
// Fall 2026 Undergraduate Catalog course listings.
const COURSES: {
  group: string;
  items: { code: string; title: string; desc: string }[];
}[] = [
  {
    group: "Biomedical Engineering",
    items: [
      {
        code: "BME 100",
        title: "Introduction to Biomedical Engineering",
        desc: "A rigorous introduction to biomedical engineering covering bioelectricity and biosensors (action potentials to signal processing), bioimaging, genetic engineering, and biostatistics, with hands-on computational modeling of physiological feedback loops.",
      },
      {
        code: "BME 120",
        title: "Programming Fundamentals in Biomedical Engineering",
        desc: "Theory and fundamentals of computer programming for biomedical applications: computer architecture, the interaction between hardware, OS, and application software, and the programming control logic and style critical to all languages, taught primarily in MATLAB.",
      },
      {
        code: "BME 203",
        title: "Emergent Biodesign",
        desc: "Team-based design experience covering CAD, 3D printing, microcontroller programming, and hands-on prototyping to solve real engineering problems, with exposure to clinical settings to learn how to identify clinical needs.",
      },
      {
        code: "BME 212",
        title: "Biomedical Engineering Research Fundamentals",
        desc: "Data collection and analysis in the context of biophysical measurements, covering statistical measures, hypothesis testing, linear regression, and ANOVA introduced application-first, alongside instrumentation, A/D boards, and LabVIEW data collection.",
      },
      {
        code: "BME 260",
        title: "Statics and Dynamics in Biological Systems",
        desc: "Engineering statics and dynamics applied to biological systems using vector methods: free body diagrams, equilibrium, rectilinear and angular kinetics/kinematics, work, energy, and momentum, paired with the anatomy and physiology of the musculoskeletal, nervous, and cardiovascular systems.",
      },
      {
        code: "BME 271",
        title: "Introduction to Electric Circuits and Bioelectricity",
        desc: "Fundamental circuit analysis of lumped time-invariant models of resistors, capacitors, and inductors, Ohm's and Kirchhoff's Laws, nodal and mesh analysis, two-port equivalents, and steady-state AC, applied to biomedical instrumentation, cell electrophysiology, and biopotentials.",
      },
      {
        code: "BME 300",
        title: "Writing in Biomedical Engineering",
        desc: "The upper-division writing requirement for the biomedical engineering major, satisfied through technical writing produced alongside an upper-division BME course.",
      },
      {
        code: "BME 304",
        title: "Genetic Engineering",
        desc: "Molecular bioengineering with a focus on genetic engineering: DNA structure and function, genetic information flow, recombinant DNA methodology, cloning and transgenics, biotechnology and bioprocessing, and gene therapy, including the ethical, regulatory, and risk-benefit dimensions.",
      },
      {
        code: "BME 361",
        title: "Data Science with Python",
        desc: "Python programming applied to real-world data analysis: the standard library, functions, loops, classes and objects, strings, lists, and tuples, plus advanced packages for processing biomedical data and images, taught through both lecture and laboratory.",
      },
      {
        code: "BME 499",
        title: "Research in Biomedical Engineering",
        desc: "An independent research project conducted under faculty supervision.",
      },
    ],
  },
  {
    group: "Applied Mathematics & Statistics",
    items: [
      {
        code: "AMS 210",
        title: "Applied Linear Algebra",
        desc: "Theory and use of vectors and matrices: matrix theory and systems of linear equations, Euclidean and abstract vector spaces, eigenvectors and eigenvalues, and linear transformations.",
      },
      {
        code: "AMS 261",
        title: "Applied Calculus III",
        desc: "Vector algebra and analytic geometry in two and three dimensions; multivariable differential calculus and tangent planes; multivariable integral calculus; optimization and Lagrange multipliers; vector calculus including Green's and Stokes's theorems.",
      },
      {
        code: "AMS 310",
        title: "Survey of Probability and Statistics",
        desc: "Data analysis, probability theory, and statistics: stem-and-leaf and box plots, fitting straight-line relationships, discrete and continuous probability distributions, conditional and binomial distributions, normal and t distributions, confidence intervals, and significance tests.",
      },
      {
        code: "AMS 361",
        title: "Applied Calculus IV: Differential Equations",
        desc: "Homogeneous and inhomogeneous linear differential equations; systems of linear differential equations; solutions via power series and Laplace transforms; partial differential equations and Fourier series.",
      },
    ],
  },
  {
    group: "Science",
    items: [
      {
        code: "BIO 202",
        title: "Fundamentals of Biology: Molecular and Cellular Biology",
        desc: "The fundamentals of cell biology, biochemistry, and genetics: the biochemical and molecular bases of cell structure, energy metabolism, gene regulation, heredity, and development across organisms from bacteria to humans.",
      },
      {
        code: "CHE 321",
        title: "Organic Chemistry I",
        desc: "The structure, reactivity, and properties of organic compounds presented through modern views of chemical bonding, applied to topics ranging from synthetic chemistry to complex functional structures such as lipid bilayers.",
      },
      {
        code: "CHE 322",
        title: "Organic Chemistry IIA",
        desc: "A continuation of the structure, reactivity, and properties of organic compounds introduced in CHE 321, emphasizing the chemistry of substances important in biology, medicine, and technology.",
      },
    ],
  },
  {
    group: "Finance & Writing",
    items: [
      {
        code: "BUS 330",
        title: "Principles of Finance",
        desc: "Core concepts and tools in finance: the role of the financial manager, developing and analyzing corporate financial statements, recognizing a corporation's main sources and uses of funds, and the capital budgeting process.",
      },
      {
        code: "ACC 210",
        title: "Financial Accounting",
        desc: "Fundamental financial accounting principles concentrating on identifying, recording, and communicating the economic events of a business: the accounting cycle, income statement, retained earnings statement, and balance sheet, with in-depth treatment of assets and liabilities.",
      },
      {
        code: "BUS 230",
        title: "Personal Finance",
        desc: "Personal finance management knowledge and analytical technique for financial decision-making, covering budgeting, debt management, investments, insurance, retirement, and estate planning.",
      },
      {
        code: "WRT 102",
        title: "Intermediate Writing Workshop",
        desc: "Strategies for extended academic writing, covering critical analysis, argument and point of view, and multi-source college-level research essays, developing rhetorical awareness, analytical proficiency, and academic research skills.",
      },
    ],
  },
];

const LEADERSHIP = [
  {
    org: "Alpha Eta Mu Beta (AEMB) Honor Society",
    role: "Website Developer, Elective Board",
    date: "Apr 2026 \u2013 Present",
    icon: "\ud83c\udfc5",
    logo: "/leadership/aemb.png",
    bullets: [
      "Designing promotional content, including digital and print flyers, to foster attendance and awareness for organizational events through weekly department emails.",
      "Managing routine updates to the organization\u2019s website and developing social media presence, executing a regular posting schedule to ensure digital content is accurate, user-friendly, and accessible.",
      "Utilized design tools (Canva, Adobe Express) to produce professional marketing materials for various events, driving an increase in event participation across departments.",
    ],
  },
  {
    org: "NYC Public School Athletic League Varsity Fencing Team",
    role: "Athletic Team Manager",
    date: "Sep 2022 \u2013 Jul 2024",
    icon: "\ud83e\udd3a",
    logo: "/leadership/psal.png",
    bullets: [
      "Directed end-to-end logistics, equipment management, scheduling, and event coordination for a competitive roster of 20+ athletes, ensuring seamless operational continuity across local and regional tournaments.",
      "Served as the primary point of contact for team members, resolving logistical issues, relaying athletic performance feedback, and providing ongoing administrative support.",
    ],
  },
];

// ─── HOOKS ────────────────────────────────────────────────────────────────────

// Reveals `.reveal` elements as they scroll into view. Re-runs whenever `dep`
// changes so content swapped in by a filter (which mounts fresh, still-hidden
// nodes) gets observed too, otherwise those cards stay stuck at opacity 0.
function useReveal(dep?: unknown) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.visible)");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [dep]);
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="reveal">
      <span className="section-label">
        <span className="w-6 h-px bg-accent inline-block" /> {label}
      </span>
      <h2 className="section-heading">{title}</h2>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span className="tag">{label}</span>;
}

function SkillIcon({ name, size = 16 }: { name: string; size?: number }) {
  const url = iconUrl(name);
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<ProjectTag>("All");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Both default off/light for first-time visitors; a saved preference wins.
  const [bgOn, setBgOn] = useState(false);
  const [dark, setDark] = useState(false);
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Restore a previously chosen background preference (default stays off).
  useEffect(() => {
    if (localStorage.getItem("bg3d") === "1") setBgOn(true);
  }, []);
  // Persist only on an actual user action, so the default never overwrites a
  // saved choice during the first render pass.
  const toggleBg = () => {
    setBgOn((prev) => {
      const next = !prev;
      localStorage.setItem("bg3d", next ? "1" : "0");
      return next;
    });
  };

  // Theme. The inline script in layout.tsx already set the class before paint;
  // here we just sync React state to it, then own it from the toggle onward.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // Scroll progress bar + scroll-spy for the nav.
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? (doc.scrollTop / max) * 100 : 0);

      // Active section = the last one whose top has crossed the 40% viewport
      // line. Empty while still on the hero, so nothing is highlighted before
      // the reader has actually reached a section.
      const line = window.innerHeight * 0.4;
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useReveal(activeFilter);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty("--mx", `${x}%`);
      hero.style.setProperty("--my", `${y}%`);
    };
    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  const filteredProjects =
    activeFilter === "All" ? PROJECTS : PROJECTS.filter((p) => p.tags.includes(activeFilter));
  const filters: ProjectTag[] = ["All", "SWE", "Finance", "AI/ML", "Hardware", "Biomedical", "Energy", "Research"];

  return (
    <div className="min-h-screen bg-white/70 dark:bg-[#171717]/80 text-slate-800 dark:text-neutral-200">
      <ThreeBackground enabled={bgOn} dark={dark} />

      {/* Scroll progress */}
      <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-[60] h-0.5">
        <div
          className="h-full bg-accent transition-[width] duration-75 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Main"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/80 dark:bg-[#171717]/90 backdrop-blur-lg border-b border-slate-200 dark:border-neutral-700 dark:border-neutral-800 shadow-sm" : "bg-transparent"
          }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#home" className="text-slate-900 dark:text-white font-bold text-base tracking-tight font-mono">
            MK<span className="text-accent">.</span>
          </a>
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="nav-link"
                aria-current={activeSection === l.href.slice(1) ? "true" : undefined}
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title={dark ? "Light mode" : "Dark mode"}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-300 hover:text-accent hover:border-accent transition-colors"
            >
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleBg}
              aria-pressed={bgOn}
              title={bgOn ? "Turn off 3D background" : "Turn on 3D background"}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${bgOn
                  ? "border-accent/40 text-accent bg-accent-soft/50"
                  : "border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-neutral-200"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${bgOn ? "bg-accent" : "bg-slate-300 dark:bg-neutral-600"}`} />
              3D
            </button>
            <a
              href="/Matthew_Kuan_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine text-xs font-semibold bg-slate-900 dark:bg-accent text-white dark:text-neutral-900 px-4 py-2 rounded-lg hover:bg-accent dark:hover:bg-accent-light transition-colors"
            >
              Resume ↗
            </a>
          </div>
          <button
            className="md:hidden text-slate-700 dark:text-neutral-200 text-xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span aria-hidden="true">{mobileMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#171717] border-t border-slate-200 dark:border-neutral-800 px-6 py-4 flex flex-col gap-4 shadow-lg">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-link text-base"
                aria-current={activeSection === l.href.slice(1) ? "true" : undefined}
                onClick={() => setMobileMenuOpen(false)}>{l.label}</a>
            ))}
            <a href="/Matthew_Kuan_Resume.pdf" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent">Resume ↗</a>
            <button
              onClick={toggleTheme}
              className="text-left text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-accent transition-colors"
            >
              Switch to {dark ? "light" : "dark"} mode
            </button>
            <button
              onClick={toggleBg}
              aria-pressed={bgOn}
              className="text-left text-sm font-medium text-slate-500 dark:text-neutral-400 hover:text-accent transition-colors"
            >
              {bgOn ? "Disable" : "Enable"} 3D background
            </button>
          </div>
        )}
      </nav>

      <main id="main">

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        id="home"
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{
          // Pointer-follow spotlight, tinted from the active accent.
          background:
            "radial-gradient(600px circle at var(--mx, 50%) var(--my, 30%), color-mix(in srgb, var(--accent) 9%, transparent), transparent 70%)",
        }}
      >
        <div className="absolute inset-0 grid-bg" />
        <div className="blob blob-1 bg-blue-300/40 dark:bg-orange-500/30 w-[380px] h-[380px] top-[-60px] right-[10%]" />
        <div className="blob blob-2 bg-indigo-300/30 dark:bg-amber-500/20 w-[320px] h-[320px] bottom-[10%] left-[5%]" />

        {/* Entrance order is intentional: the name lands first, then the
            supporting details cascade in around it. */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 w-full pt-24 pb-16">
          <p className="font-mono text-accent text-sm mb-5 animate-fade-up" style={{ animationDelay: "0.75s" }}>
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${CURRENTLY.available ? "bg-green-500 animate-pulse" : "bg-slate-400 dark:bg-neutral-500"}`}
              aria-hidden="true"
            />
            {CURRENTLY.available
              ? `Open to ${CURRENTLY.seeking}`
              : "Not currently seeking roles"}
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-neutral-50 mb-4 leading-[1.05] tracking-tight animate-fade-up"
            style={{ animationDelay: "0s" }}>
            Matthew Kuan
          </h1>
          {/* A tagline, not a section, so keep it out of the heading outline. */}
          <p className="text-2xl md:text-3xl gradient-text font-bold mb-6 animate-fade-up"
            style={{ animationDelay: "0.9s" }}>
            Software Engineer &amp; Applied Mathematician
          </p>
          <p className="text-slate-600 dark:text-neutral-300 text-base md:text-lg max-w-2xl leading-relaxed mb-8 animate-fade-up"
            style={{ animationDelay: "1.05s" }}>
            Junior at <span className="text-slate-900 dark:text-neutral-50 font-medium">Stony Brook University</span> studying{" "}
            <span className="text-slate-900 dark:text-neutral-50 font-medium">Biomedical Engineering & Applied Mathematics</span> (GPA 3.72),
            minoring in <span className="text-slate-900 dark:text-neutral-50 font-medium">Finance</span>. I build software and quantitative
            models that turn messy data into decisions, across markets, engineering systems, and the lab.
          </p>
          <div className="flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "1.2s" }}>
            <a href="#projects"
              className="btn-shine bg-slate-900 dark:bg-neutral-800 text-white font-medium px-6 py-3 rounded-xl hover:bg-accent transition-colors text-sm">
              View Projects
            </a>
            <a href="#contact"
              className="border border-slate-300 text-slate-700 dark:text-neutral-300 font-medium px-6 py-3 rounded-xl hover:border-accent hover:text-accent transition-colors text-sm">
              Contact Information
            </a>
            <div className="flex items-center gap-1 ml-2">
              <a href="https://linkedin.com/in/matt-kuan" target="_blank" rel="noopener noreferrer"
                aria-label="Matthew Kuan on LinkedIn (opens in a new tab)"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-accent hover:border-accent transition-colors text-sm font-medium">
                <span aria-hidden="true">in</span>
              </a>
              <a href="https://github.com/s3raphsembrace" target="_blank" rel="noopener noreferrer"
                aria-label="Matthew Kuan on GitHub (opens in a new tab)"
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-accent hover:border-accent transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>
              </a>
            </div>
          </div>

        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-slate-500 dark:text-neutral-400 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── SKILLS MARQUEE ──────────────────────────────────────────────── */}
      {/* Decorative: the list is duplicated for the seamless loop, so hide it
          from assistive tech, since the real skill list lives in the Skills section. */}
      <div aria-hidden="true" className="marquee-wrap border-y border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 py-4 overflow-hidden">
        <div className="marquee-track flex gap-10 whitespace-nowrap w-max items-center">
          {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].map((s, i) => (
            <span key={i} className="text-slate-500 dark:text-neutral-400 font-mono text-sm flex items-center gap-2.5 grayscale hover:grayscale-0 transition-all">
              <SkillIcon name={s} size={18} /> {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ME ────────────────────────────────────────────────────── */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Who I Am" title="About Me" />
        <div className="grid md:grid-cols-[300px_1fr] gap-10 items-start">
          {/* Photo */}
          <div className="reveal">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-accent/30 to-indigo-300/30 rounded-3xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/me.jpg"
                alt="Matthew Kuan"
                className="relative w-full aspect-[3/4] object-cover rounded-3xl border border-slate-200 dark:border-neutral-700 shadow-lg"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["🧗 Bouldering", "🛹 Skating", "🤺 Fencing"].map((f) => (
                <span key={f} className="text-xs text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2.5 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="reveal space-y-4">
            <p className="text-slate-700 dark:text-neutral-300 text-base leading-relaxed">
              Hello! I am a junior at Stony Brook University double majoring in Biomedical Engineering and Applied Mathematics & Statistics, with a minor in Finance. I'm interested in software engineering, quantitative analysis, and markets, and most of my favorite work has been building systems that take messy data and turn it into a decision someone can actually act on. That has looked like a full-stack investment return model, a pipeline that flags bad inputs before they reach an expensive stage, and a 10-year forecast for a multifamily acquisition. I enjoy learning new skills across disciplines, and I'm always open to opportunities that help me grow technically and professionally.
              Feel free to connect with me and contact me at matthew.kuan@stonybrook.edu.
              I studied abroad at Yonsei University in Seoul, which
              sharpened how I adapt and communicate across very different environments.
            </p>
            <p className="text-slate-700 dark:text-neutral-300 text-base leading-relaxed">
              Outside of work, I&apos;m usually moving. I picked up bouldering and
              love heading out for outdoor climbs around the city, and the climbing community is easily one of
              the most welcoming I&apos;ve found. I skateboard at
              the local skate park through the summer, and I spent high school managing a
              PSAL varsity fencing team, which taught me
              a lot about logistics, showing up for people, and keeping a group organized under pressure.
              Curiosity is the common thread through all of it. I&apos;m happiest when I&apos;m learning
              something new and figuring out how it fits together.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#projects" className="btn-shine bg-slate-900 dark:bg-neutral-800 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm">
                See My Work
              </a>
              <a href="#contact" className="border border-slate-300 text-slate-700 dark:text-neutral-300 font-medium px-5 py-2.5 rounded-xl hover:border-accent hover:text-accent transition-colors text-sm">
                Contact Information
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDUCATION ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Background" title="Education" />
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card reveal">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-900 dark:text-neutral-50 font-bold">Stony Brook University</p>
                <p className="text-slate-500 dark:text-neutral-400 text-sm">B.E. Biomedical Engineering & Applied Math</p>
              </div>
              <span className="text-slate-500 dark:text-neutral-400 text-xs text-right shrink-0 ml-2">Expected May 2028</span>
            </div>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mb-3">
              Minor: Finance · Biomechanics & Materials · <span className="text-accent font-semibold">GPA 3.72</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Probability & Statistics", "Differential Equations", "Principles of Finance", "Financial Accounting", "Personal Finance"].map(c => (
                <span key={c} className="text-xs text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
          <div className="card reveal">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-slate-900 dark:text-neutral-50 font-bold">Yonsei University</p>
                <p className="text-slate-500 dark:text-neutral-400 text-sm">International Academic Programs Scholarship</p>
              </div>
              <span className="text-slate-500 dark:text-neutral-400 text-xs text-right shrink-0 ml-2">Seoul, South Korea</span>
            </div>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mb-3">
              Study Abroad · <span className="text-accent font-semibold">GPA 4.30 / 4.30</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["East Asian Art History", "Linear Algebra"].map(c => (
                <span key={c} className="text-xs text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ──────────────────────────────────────────────────── */}
      <section id="experience" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Where I've Worked" title="Experience" />
        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent via-slate-200 to-transparent" />
          <div className="flex flex-col gap-6">
            {EXPERIENCE.map((e) => (
              <div key={e.org} className="relative pl-8 reveal">
                <div className="absolute left-0 top-6 w-3.5 h-3.5 rounded-full bg-white border-2 border-accent" />
                <div className="card">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-3">
                    <div>
                      <p className="text-slate-900 dark:text-neutral-50 font-bold">{e.org}</p>
                      <p className="text-slate-500 dark:text-neutral-400 text-sm">{e.sub}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-accent text-sm font-semibold">{e.role}</p>
                      <p className="text-slate-500 dark:text-neutral-400 text-xs">{e.date} · {e.location}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {e.bullets.map((b, i) => (
                      <li key={i} className="text-slate-600 dark:text-neutral-300 text-sm flex gap-2.5">
                        <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {e.tags.map((t) => <Tag key={t} label={t} />)}
                    {e.links?.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent-soft/60 border border-accent/20 px-2.5 py-1 rounded-full hover:bg-accent hover:text-white transition-colors">
                        {l.label}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH ────────────────────────────────────────────────────── */}
      <section id="research" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Labs & Publications" title="Research Experience" />
        <div className="flex flex-col gap-5">
          {RESEARCH.map((r) => (
            <div key={r.org} className="card reveal">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-3">
                <div>
                  <p className="text-slate-900 dark:text-neutral-50 font-bold">{r.org}</p>
                  <p className="text-slate-500 dark:text-neutral-400 text-sm">{r.sub}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-accent text-sm font-semibold">{r.role}</p>
                  <p className="text-slate-500 dark:text-neutral-400 text-xs">{r.date}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {r.bullets.map((b, i) => (
                  <li key={i} className="text-slate-600 dark:text-neutral-300 text-sm flex gap-2.5">
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {r.tags.map((t) => <Tag key={t} label={t} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive model of the device the lab work above describes. */}
        <div className="mt-12 reveal">
          <h3 className="text-slate-900 dark:text-neutral-50 font-bold mb-1 flex items-center gap-2">
            <span className="text-accent" aria-hidden="true">🔬</span>
            Explore the dPCR Device
          </h3>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mb-5 max-w-2xl">
            An interactive model of the thermoplastic partitioning device I fabricate.
            Rotate it, or select a component to read what it does and how it&apos;s made.
          </p>
          <MicrofluidicChip dark={dark} />
        </div>

        <div className="mt-12 reveal">
          <h3 className="text-slate-900 dark:text-neutral-50 font-bold mb-4 flex items-center gap-2">
            <span className="text-accent" aria-hidden="true">📄</span> Poster Presentations
          </h3>
          <div className="flex flex-col gap-3">
            {POSTERS.map((p) => (
              <a key={p.title} href={p.pdf} target="_blank" rel="noopener noreferrer"
                className="group flex gap-4 items-center p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-200 dark:border-neutral-700 hover:border-accent/40 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-lg hover:shadow-accent/5 transition-all">
                <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center shrink-0 text-accent text-sm font-bold group-hover:bg-accent group-hover:text-white transition-colors">P</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-neutral-100 text-sm font-medium leading-snug group-hover:text-accent transition-colors">{p.title}</p>
                  <p className="text-slate-500 dark:text-neutral-400 text-xs mt-1">{p.venue}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-neutral-400 group-hover:text-accent flex items-center gap-1 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                  View PDF
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ────────────────────────────────────────────────────── */}
      <section id="projects" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Things I've Built" title="Projects" />
        <div className="flex flex-wrap gap-2 mb-8 reveal">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all duration-200 ${activeFilter === f
                  ? "bg-slate-900 dark:bg-accent text-white dark:text-neutral-900 border-slate-900 dark:border-accent"
                  : "border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-accent hover:text-accent"
                }`}>
              {f}
            </button>
          ))}
        </div>
        {/* `layout` lets surviving cards slide to their new grid position when
            the filter changes, instead of snapping. Cards entering/leaving
            fade and scale via AnimatePresence. */}
        <LazyMotion features={loadMotionFeatures} strict>
        <m.div layout className="grid md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
          {filteredProjects.map((p) => (
            <m.div
              key={p.name}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.7 }}
              className="card flex flex-col group">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="text-slate-900 dark:text-neutral-50 font-bold group-hover:text-accent transition-colors">{p.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} live demo`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Live Demo
                    </a>
                  )}
                  {p.repo && (
                    <a href={p.repo} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} code`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700 px-2 py-1 rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>
                      Code
                    </a>
                  )}
                  {p.pdf && (
                    <a href={p.pdf} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} ${p.pdfLabel ?? "slides"}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent bg-accent-soft/60 border border-accent/20 px-2 py-1 rounded-lg hover:bg-accent hover:text-white transition-colors">
                      {p.pdfLabel ?? "Slides"}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                    </a>
                  )}
                  {p.extra && (
                    <a href={p.extra.href} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} ${p.extra.label}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700 px-2 py-1 rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors">
                      {p.extra.label}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                    </a>
                  )}
                </div>
              </div>
              <p className="text-slate-500 dark:text-neutral-400 text-xs font-mono mb-2 leading-relaxed">{p.stack}</p>
              <p className="text-accent text-xs mb-3 font-medium">{p.context}</p>
              <p className="text-slate-900 dark:text-neutral-100 text-sm font-semibold leading-snug mb-3 pl-3 border-l-2 border-accent">
                {p.impact}
              </p>
              <ul className="space-y-1.5 flex-1 mb-4">
                {p.bullets.map((b, i) => (
                  <li key={i} className="text-slate-600 dark:text-neutral-300 text-sm flex gap-2.5">
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => <Tag key={t} label={t} />)}
              </div>
            </m.div>
          ))}
          </AnimatePresence>
        </m.div>
        </LazyMotion>
      </section>

      {/* ── SKILLS ──────────────────────────────────────────────────────── */}
      <section id="skills" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="My Toolkit" title="Skills" />
        <div className="grid sm:grid-cols-2 gap-5">
          {Object.entries(SKILLS).map(([category, skills]) => (
            <div key={category} className="card reveal">
              <p className="text-slate-900 dark:text-neutral-50 font-bold text-sm mb-3">{category}</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-2 text-sm bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg border border-transparent hover:bg-white dark:hover:bg-neutral-800 hover:border-accent/30 hover:text-accent transition-colors">
                    <SkillIcon name={s} size={20} />{s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEADERSHIP ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="Beyond the Lab" title="Leadership & Activities" />
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {LEADERSHIP.map((l) => (
            <div key={l.org} className="card reveal">
              <div className="flex items-start gap-4 mb-3">
                {/* Fixed height, flexible width so square seals and wide
                    wordmarks both render at a legible size. Falls back to the
                    emoji if the logo file is missing. */}
                <div className="h-12 min-w-12 max-w-[132px] rounded-xl bg-white dark:bg-neutral-100 flex items-center justify-center shrink-0 text-2xl border border-slate-200 dark:border-neutral-600 overflow-hidden px-2 py-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.logo}
                    alt=""
                    aria-hidden="true"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const fb = img.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "block";
                    }}
                  />
                  <span aria-hidden="true" style={{ display: "none" }}>{l.icon}</span>
                </div>
                <div>
                  <p className="text-slate-900 dark:text-neutral-50 font-bold leading-snug">{l.org}</p>
                  <p className="text-accent text-sm font-semibold">{l.role}</p>
                  <p className="text-slate-500 dark:text-neutral-400 text-xs">{l.date}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {l.bullets.map((b, i) => (
                  <li key={i} className="text-slate-600 dark:text-neutral-300 text-sm flex gap-2.5">
                    <span aria-hidden="true" className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Verified credentials link out; everything else is a plain chip. */}
        <div className="reveal flex flex-wrap gap-2 mb-3">
          {[
            {
              label: "McKinsey Forward Program",
              href: "https://www.credly.com/badges/e884f382-6142-4b8d-bdb2-2528d7e5800c",
            },
            {
              label: "Project Destined Certificate",
              href: "https://certificates.projectdestined.com/credentials/1425608d-a330-4131-b53a-867041192574?recipient=true",
            },
          ].map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent-soft/60 border border-accent/25 px-3 py-1.5 rounded-full hover:bg-accent hover:text-white dark:hover:text-neutral-900 transition-colors"
            >
              {c.label}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
            </a>
          ))}
        </div>
        <div className="reveal flex flex-wrap gap-2">
          {["Project Destined 2026", "Goldman Sachs ELS 2026", "McKinsey Forward 2026", "SBU Bioinformatics Bootcamp 2024", "VIP BEAR Team 2024–26", "HackerRank Orchestrate #85/1773", "HopperHacks WiCS 2026", "L'Oréal Brandstorm 2026", "BMES", "AEMB Honor Society"].map(a => (
            <span key={a} className="text-xs text-slate-500 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700 px-3 py-1.5 rounded-full hover:border-accent/40 hover:text-accent transition-colors">{a}</span>
          ))}
        </div>
      </section>

      {/* ── COURSEWORK ──────────────────────────────────────────────────── */}
      <section id="coursework" className="max-w-5xl mx-auto px-6 py-20">
        <SectionHeading label="What I've Studied" title="Coursework" />
        <p className="reveal text-slate-500 dark:text-neutral-400 text-sm mb-8 -mt-6 max-w-2xl">
          Selected courses from my Biomedical Engineering &amp; Applied Mathematics degree.
          Click any course to read its catalog description.
        </p>
        <div className="flex flex-col gap-8">
          {COURSES.map((grp) => (
            <div key={grp.group} className="reveal">
              <h3 className="text-slate-900 dark:text-neutral-50 font-bold text-sm mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-accent inline-block" />
                {grp.group}
              </h3>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {grp.items.map((c) => {
                  const key = c.code;
                  const open = openCourse === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setOpenCourse(open ? null : key)}
                      aria-expanded={open}
                      aria-controls={`course-panel-${key.replace(/\s+/g, "-")}`}
                      className={`text-left rounded-xl border p-4 transition-all duration-300 ${
                        open
                          ? "bg-white dark:bg-neutral-800 border-accent/40 shadow-lg shadow-accent/5"
                          : "bg-white/60 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-700 hover:border-accent/30 hover:bg-white dark:hover:bg-neutral-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-xs text-accent font-semibold">{c.code}</span>
                          <p className="text-slate-800 dark:text-neutral-100 text-sm font-medium leading-snug">{c.title}</p>
                        </div>
                        <span
                          aria-hidden="true"
                          className={`shrink-0 mt-0.5 text-slate-500 dark:text-neutral-400 transition-transform duration-300 ${
                            open ? "rotate-45 text-accent" : ""
                          }`}
                        >
                          +
                        </span>
                      </div>
                      <div
                        id={`course-panel-${key.replace(/\s+/g, "-")}`}
                        className={`grid transition-all duration-300 ease-out ${
                          open ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-slate-600 dark:text-neutral-300 text-xs leading-relaxed">{c.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="reveal text-slate-500 dark:text-neutral-400 text-xs mt-8">
          Course descriptions adapted from the{" "}
          <a
            href="https://catalog.stonybrook.edu/content.php?catoid=11&navoid=1135"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Stony Brook University Undergraduate Catalog
          </a>
          .
        </p>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────────────────── */}
      <section id="contact" className="max-w-5xl mx-auto px-6 py-20">
        <div className="reveal relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-neutral-800 px-8 py-14 md:px-14">
          <div className="blob bg-accent/30 w-[300px] h-[300px] top-[-80px] right-[-40px]" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-10 tracking-tight">
              Contact Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                { label: "Email", value: "matthew.kuan@stonybrook.edu", href: "mailto:matthew.kuan@stonybrook.edu" },
                { label: "Phone", value: "(347) 479-4729", href: "tel:3474794729" },
                { label: "LinkedIn", value: "linkedin.com/in/matt-kuan", href: "https://linkedin.com/in/matt-kuan" },
                { label: "GitHub", value: "github.com/s3raphsembrace", href: "https://github.com/s3raphsembrace" },
              ].map((c) => (
                <a key={c.label} href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent/50 transition-all group">
                  <span className="text-slate-500 dark:text-neutral-400 text-xs w-16 shrink-0 font-mono uppercase tracking-wider">{c.label}</span>
                  <span className="text-slate-100 text-sm group-hover:text-accent-light transition-colors truncate">{c.value}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      </main>

      <footer className="border-t border-slate-200 dark:border-neutral-700 max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-slate-500 dark:text-neutral-400 text-xs">Designed & built by Matthew Kuan · © 2026</p>
          <p className="text-slate-500 dark:text-neutral-400 text-xs font-mono">Next.js · Tailwind CSS · Vercel</p>
        </div>
      </footer>
    </div>
  );
}
