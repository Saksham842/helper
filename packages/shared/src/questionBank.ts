/**
 * GhostPilot Shared Question Bank
 * Curated repository of technical, system design, coding, and behavioral interview questions
 * with difficulty tiers, tagging, STAR guidance, and key evaluation points.
 */

export type QuestionCategory =
  | 'System Design'
  | 'Algorithms'
  | 'Frontend & React'
  | 'Backend & Distributed Systems'
  | 'Behavioral & Leadership'
  | 'DevOps & Cloud';

export type QuestionTag =
  | 'Behavioural'
  | 'Technical'
  | 'System Design'
  | 'Coding'
  | 'Strategy'
  | 'Architecture';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface QuestionBankItem {
  id: string;
  category: QuestionCategory;
  tags: QuestionTag[];
  difficulty: DifficultyLevel;
  difficultyTier: 1 | 2 | 3; // 1 = Entry/Junior, 2 = Mid/Senior, 3 = Staff/Principal
  question: string;
  source: string;
  hint: string;
  modelAnswer: string;
  keyPoints: string[];
}

export const QUESTION_BANK: QuestionBankItem[] = [
  {
    id: 'q-1',
    category: 'System Design',
    tags: ['System Design', 'Architecture', 'Technical'],
    difficulty: 'Hard',
    difficultyTier: 3,
    question: 'How do you design a distributed URL shortener (e.g. TinyURL) supporting 50,000 writes/sec and 5,000,000 reads/sec?',
    source: 'Live HUD Session • Stripe Bar Raiser',
    hint: 'Think about ID generation (Snowflake vs DB auto-increment), Base62 encoding length, read-heavy caching with Redis, and partition keys.',
    modelAnswer:
      'Partition the system using distributed unique 64-bit ID generators (Twitter Snowflake/KSUID) encoded in Base62. Store metadata in horizontally sharded NoSQL (Cassandra/DynamoDB) keyed by short_hash. Front reads with distributed Redis cluster (LRU eviction) to achieve sub-10ms latency.',
    keyPoints: [
      'Base62 encoding (62^7 = ~3.5 trillion URLs)',
      'Snowflake 64-bit ID generation without central database bottleneck',
      'Multi-tiered caching with 80/20 read traffic pattern',
      'Rate limiting and Bloom filters to block malicious non-existent queries',
    ],
  },
  {
    id: 'q-2',
    category: 'Algorithms',
    tags: ['Coding', 'Technical'],
    difficulty: 'Hard',
    difficultyTier: 3,
    question: 'Design a Data Structure for Finding Median from a Data Stream with O(1) median query and O(log N) insertion.',
    source: 'Live HUD Session • Google DSA',
    hint: 'Can you partition the numbers into two halves using two heaps? Max-heap for the lower half and min-heap for the upper half.',
    modelAnswer:
      'Maintain two priority queues (heaps): a max-heap for the smaller half of numbers and a min-heap for the larger half. Balance heaps after every insertion so their sizes differ by at most 1. The median is either the top of the larger heap or the average of both tops.',
    keyPoints: [
      'Dual heap approach (MaxHeap for lower half, MinHeap for upper half)',
      'Balancing condition: |size(Max) - size(Min)| <= 1',
      'Time Complexity: O(log N) per insert, O(1) for findMedian',
      'Space Complexity: O(N) total storage',
    ],
  },
  {
    id: 'q-3',
    category: 'Frontend & React',
    tags: ['Technical', 'Architecture'],
    difficulty: 'Medium',
    difficultyTier: 2,
    question: 'How does React 19 Concurrent Rendering and Suspense optimize UI responsiveness during heavy state transitions?',
    source: 'Mock Interview • Frontend Specialist',
    hint: 'Highlight the difference between urgent user inputs vs non-urgent view transitions (useTransition, useDeferredValue) and streaming SSR.',
    modelAnswer:
      'React 19 separates state updates into urgent and non-urgent transitions (via useTransition and useDeferredValue). Non-urgent renders can be paused or abandoned if new input arrives, keeping the main thread free for 60fps input latency (INP). Suspense boundaries coordinate fallback loading states without unmounting surrounding DOM trees.',
    keyPoints: [
      'Interruptible background rendering without blocking browser event loop',
      'useTransition hooks for non-urgent filter/sort calculations',
      'Automatic batching across asynchronous microtasks and timers',
      'Optimized hydration mechanics with streaming SSR',
    ],
  },
  {
    id: 'q-4',
    category: 'Backend & Distributed Systems',
    tags: ['System Design', 'Technical'],
    difficulty: 'Medium',
    difficultyTier: 2,
    question: 'What is the difference between Optimistic Concurrency Control and Pessimistic Locking in high-concurrency ticket reservations?',
    source: 'Live HUD Session • Uber Backend',
    hint: 'Compare SELECT FOR UPDATE vs version-number CAS (Compare-And-Swap), noting collision frequency, rollback costs, and lock timeouts.',
    modelAnswer:
      'Pessimistic locking uses database row/table locks (SELECT FOR UPDATE) preventing concurrent access until commit, preventing conflicts at the cost of high throughput degradation and potential deadlocks. Optimistic locking verifies a version column at commit time (WHERE id = ? AND version = ?); if version changed, the transaction aborts and retries. For ticket booking, pessimistic locks or Redis distributed locks (Redlock) with short TTLs are typically preferred to prevent duplicate seat assignments.',
    keyPoints: [
      'Pessimistic: Safe for high-contention resources, lower throughput',
      'Optimistic: High read performance, retry loops under collision',
      'Distributed lock with Redis Lua script for millisecond-level atomicity',
    ],
  },
  {
    id: 'q-5',
    category: 'Behavioral & Leadership',
    tags: ['Behavioural', 'Strategy'],
    difficulty: 'Medium',
    difficultyTier: 2,
    question: 'Describe a situation where you had a strong technical disagreement with a team lead and how you resolved it.',
    source: 'Mock Drill • Behavioral Track',
    hint: 'Use STAR: Frame the Situation, Task, concrete Action taken (data/benchmarks over opinions), and measurable business/team Result.',
    modelAnswer:
      'Answer following the STAR method: Frame the Situation (disagreement over GraphQL vs REST/gRPC for a mobile API), Task (deliver high-throughput API with tight deadlines), Action (created empirical latency and payload benchmarks, organized an objective tradeoff matrix with team lead, agreed on pilot branch), and Result (lead adopted gRPC for microservices and REST for client, reducing network serialization overhead by 40%).',
    keyPoints: [
      'STAR structure (Situation, Task, Action, Result)',
      'Empirical data and benchmarks over personal opinions',
      'Commitment to team alignment and shared post-decision ownership',
    ],
  },
  {
    id: 'q-6',
    category: 'System Design',
    tags: ['System Design', 'Architecture'],
    difficulty: 'Hard',
    difficultyTier: 3,
    question: 'Design a Real-Time Collaborative Document Editor like Google Docs or Figma supporting offline edits and conflict resolution.',
    source: 'Live HUD Session • Meta Infrastructure',
    hint: 'Explain CRDTs (Conflict-free Replicated Data Types like Yjs / Automerge) vs Operational Transformation (OT), and WebSocket state synchronization.',
    modelAnswer:
      'State-based or Operation-based CRDTs (e.g. RGA or Yjs tree model) ensure eventual consistency without a central locking authority. Clients broadcast discrete character operations with vector clocks over WebSockets. A central coordinator acts as relay and durable persistence layer (PostgreSQL + S3 snapshots) while handling client reconnect divergence.',
    keyPoints: [
      'CRDT vs OT trade-offs in distributed collaborative editing',
      'Vector clocks and Lamport timestamps for causality ordering',
      'WebSocket bi-directional delta streaming and snapshot compaction',
      'P2P WebRTC fallback for zero-broker local mesh synchronization',
    ],
  },
];

/**
 * Filter questions by category, tag, or difficulty tier
 */
export function getQuestionsByFilter(filter?: {
  category?: QuestionCategory;
  tag?: QuestionTag;
  difficulty?: DifficultyLevel;
  difficultyTier?: 1 | 2 | 3;
}): QuestionBankItem[] {
  if (!filter) return QUESTION_BANK;

  return QUESTION_BANK.filter((item) => {
    if (filter.category && item.category !== filter.category) return false;
    if (filter.tag && !item.tags.includes(filter.tag)) return false;
    if (filter.difficulty && item.difficulty !== filter.difficulty) return false;
    if (filter.difficultyTier && item.difficultyTier !== filter.difficultyTier) return false;
    return true;
  });
}
