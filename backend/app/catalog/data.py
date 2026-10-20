"""Seed catalog of interview subjects and their sub topics.

Stored in MongoDB (`subjects`, `topics`) and upserted at startup by slug, so adding or renaming
entries here is picked up on the next start without migrations. Slugs are the stable identifiers
used in URLs and in saved attempts: never change an existing slug.
"""

SOFTWARE_ENGINEERING = "Software Engineering"
PRODUCT_MANAGEMENT = "Product Management"

# (slug, name, category, description, [(topic slug, topic name), ...])
SUBJECTS: list[tuple[str, str, str, str, list[tuple[str, str]]]] = [
    (
        "data-structures-algorithms",
        "Data Structures & Algorithms",
        SOFTWARE_ENGINEERING,
        "Core problem solving: choosing the right structure, reasoning about complexity.",
        [
            ("arrays-strings", "Arrays & Strings"),
            ("linked-lists", "Linked Lists"),
            ("stacks-queues", "Stacks & Queues"),
            ("hash-tables", "Hash Tables"),
            ("trees-graphs", "Trees & Graphs"),
            ("recursion-backtracking", "Recursion & Backtracking"),
            ("dynamic-programming", "Dynamic Programming"),
            ("sorting-searching", "Sorting & Searching"),
            ("complexity-analysis", "Time & Space Complexity"),
        ],
    ),
    (
        "system-design",
        "System Design",
        SOFTWARE_ENGINEERING,
        "Designing scalable, reliable systems and explaining the trade-offs.",
        [
            ("scalability-fundamentals", "Scalability Fundamentals"),
            ("load-balancing", "Load Balancing"),
            ("caching", "Caching"),
            ("sharding-replication", "Sharding & Replication"),
            ("message-queues", "Message Queues & Streaming"),
            ("api-design", "API Design"),
            ("consistency-availability", "Consistency & Availability"),
            ("rate-limiting", "Rate Limiting"),
            ("case-studies", "End-to-end Case Studies"),
        ],
    ),
    (
        "low-level-design",
        "Low-Level Design",
        SOFTWARE_ENGINEERING,
        "Object-oriented design, patterns and clean code.",
        [
            ("solid-principles", "SOLID Principles"),
            ("design-patterns", "Design Patterns"),
            ("class-modelling", "Class Modelling"),
            ("concurrency-design", "Concurrency in Design"),
            ("testability", "Testability & Clean Code"),
        ],
    ),
    (
        "databases",
        "Databases",
        SOFTWARE_ENGINEERING,
        "SQL, data modelling, indexing and transactions.",
        [
            ("sql-fundamentals", "SQL Fundamentals"),
            ("indexing-query-optimization", "Indexing & Query Optimization"),
            ("transactions-isolation", "Transactions & Isolation Levels"),
            ("normalization", "Normalization & Schema Design"),
            ("nosql-data-modeling", "NoSQL Data Modeling"),
        ],
    ),
    (
        "backend-engineering",
        "Backend Engineering",
        SOFTWARE_ENGINEERING,
        "Building and operating services and APIs.",
        [
            ("rest-apis", "REST API Design"),
            ("authentication-authorization", "Authentication & Authorization"),
            ("microservices", "Microservices"),
            ("async-processing", "Async Processing & Jobs"),
            ("observability", "Logging, Metrics & Tracing"),
        ],
    ),
    (
        "frontend-engineering",
        "Frontend Engineering",
        SOFTWARE_ENGINEERING,
        "JavaScript, React and web performance.",
        [
            ("javascript-fundamentals", "JavaScript Fundamentals"),
            ("react-fundamentals", "React Fundamentals"),
            ("state-management", "State Management"),
            ("web-performance", "Web Performance"),
            ("browser-internals", "Browser & Web Platform"),
        ],
    ),
    (
        "cloud-devops",
        "Cloud & DevOps",
        SOFTWARE_ENGINEERING,
        "Delivery pipelines, containers and running systems reliably.",
        [
            ("ci-cd", "CI/CD"),
            ("containers-kubernetes", "Containers & Kubernetes"),
            ("infrastructure-as-code", "Infrastructure as Code"),
            ("reliability-monitoring", "Reliability & Monitoring"),
            ("cloud-fundamentals", "Cloud Fundamentals"),
        ],
    ),
    (
        "os-networking",
        "Operating Systems & Networking",
        SOFTWARE_ENGINEERING,
        "What happens beneath your code.",
        [
            ("processes-threads", "Processes & Threads"),
            ("memory-management", "Memory Management"),
            ("http-tcp", "HTTP & TCP/IP"),
            ("dns-tls", "DNS & TLS"),
        ],
    ),
    (
        "behavioral-leadership",
        "Behavioral & Leadership",
        SOFTWARE_ENGINEERING,
        "Telling clear, structured stories about your work.",
        [
            ("conflict-collaboration", "Conflict & Collaboration"),
            ("ownership-impact", "Ownership & Impact"),
            ("failure-learning", "Failure & Learning"),
            ("mentoring-leading", "Mentoring & Leading"),
        ],
    ),
    (
        "product-sense",
        "Product Sense & Design",
        PRODUCT_MANAGEMENT,
        "Understanding users and designing products people want.",
        [
            ("user-problems", "Identifying User Problems"),
            ("product-design", "Product Design Questions"),
            ("improving-products", "Improving an Existing Product"),
            ("user-research", "User Research"),
        ],
    ),
    (
        "product-strategy",
        "Product Strategy",
        PRODUCT_MANAGEMENT,
        "Vision, positioning and competitive thinking.",
        [
            ("vision-roadmap", "Vision & Roadmap"),
            ("market-competition", "Market & Competition"),
            ("go-to-market", "Go-to-Market"),
            ("pricing-monetization", "Pricing & Monetization"),
        ],
    ),
    (
        "metrics-analytics",
        "Metrics & Analytics",
        PRODUCT_MANAGEMENT,
        "Measuring success and reasoning from data.",
        [
            ("success-metrics", "Defining Success Metrics"),
            ("metric-debugging", "Debugging a Metric Drop"),
            ("experimentation", "A/B Testing & Experimentation"),
            ("estimation", "Estimation Questions"),
        ],
    ),
    (
        "execution-prioritization",
        "Execution & Prioritization",
        PRODUCT_MANAGEMENT,
        "Shipping the right things, on time.",
        [
            ("prioritization-frameworks", "Prioritization Frameworks"),
            ("tradeoffs", "Making Trade-offs"),
            ("launch-planning", "Launch Planning"),
            ("roadmap-execution", "Roadmap Execution"),
        ],
    ),
    (
        "technical-fluency",
        "Technical Fluency for PMs",
        PRODUCT_MANAGEMENT,
        "Working effectively with engineering.",
        [
            ("system-basics", "How Systems Work"),
            ("apis-integrations", "APIs & Integrations"),
            ("data-ml-basics", "Data & ML Basics"),
            ("technical-tradeoffs", "Technical Trade-offs"),
        ],
    ),
    (
        "pm-leadership",
        "Leadership & Stakeholders",
        PRODUCT_MANAGEMENT,
        "Influencing without authority.",
        [
            ("stakeholder-management", "Stakeholder Management"),
            ("influencing-without-authority", "Influencing without Authority"),
            ("team-conflict", "Handling Conflict"),
            ("pm-behavioral", "Behavioral Stories"),
        ],
    ),
]
