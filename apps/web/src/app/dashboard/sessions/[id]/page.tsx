import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Headphones,
  User,
} from 'lucide-react';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: SessionPageProps) {
  const { id } = await params;

  // Realistic post-call session intelligence data (from database or mock)
  const sessionData = {
    id,
    title: 'Senior Systems & Full-Stack Technical Evaluation',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    duration: '42 minutes',
    score: 88,
    mode: 'Technical Interview (DSA / System Design)',
    summary:
      'The candidate demonstrated senior-level systems intuition, decomposing high-throughput URL shortening and cache replication with clean boundary separation. Spoke clearly using the STAR framework when discussing past production incidents. Highlighted Redis eviction mechanics and CAP theorem tradeoffs under network partitioning.',
    rubric: {
      technicalDepth: 90,
      communication: 86,
      problemSolving: 88,
      speedAndPrecision: 89,
    },
    strengths: [
      'Articulated distributed hashing (consistent hashing with virtual nodes) with precision.',
      'Anticipated hot-partition bottleneck on URL redirection and proposed multi-tiered caching.',
      'Maintained calm, structured communication when pressed on failure recovery edge cases.',
    ],
    improvements: [
      'Provide concrete back-of-the-envelope storage calculations (PB/year) earlier in the session.',
      'Explicitly distinguish between strong consistency (Raft/Paxos) and eventual consistency in write replicas.',
    ],
    questions: [
      {
        question: 'How would you architect a distributed URL shortener handling 50k write requests per second?',
        candidateAnswer:
          'I partitioned the architecture into an API gateway, a distributed counter service using Base62 encoding with Snowflake IDs, and a multi-region Cassandra cluster with Redis Read-Through caching.',
        score: 92,
        feedback: 'Excellent choice of Base62 encoding and Cassandra partitioning strategy.',
      },
      {
        question: 'What happens when a Redis cache node fails during peak traffic?',
        candidateAnswer:
          'We implement Redis Sentinel/Cluster with read replicas, circuit breaker pattern in the API gateway, and fallback to read-replica database nodes with rate limiting.',
        score: 87,
        feedback: 'Solid resilience reasoning. Could mention cache stampede mitigation (probabilistic early expiration).',
      },
      {
        question: 'Can you describe a time when an architectural choice degraded latency in production?',
        candidateAnswer:
          'In a previous payment integration, synchronous blocking HTTP calls to third-party fraud APIs caused thread starvation. We moved to an asynchronous event-driven workflow with Kafka and webhooks, cutting p99 latency by 70%.',
        score: 89,
        feedback: 'Compelling STAR narrative with clear, quantitative business metrics.',
      },
    ],
    transcript: [
      {
        speaker: 'interviewer',
        time: '00:01:15',
        text: 'Welcome! Today we will evaluate your systems design and problem decomposition skills. Let us start with designing a distributed URL shortener.',
      },
      {
        speaker: 'candidate',
        time: '00:01:45',
        text: 'Thank you! To clarify requirements: what are our expected read and write ratios, latency targets, and URL expiration policies?',
      },
      {
        speaker: 'interviewer',
        time: '00:02:10',
        text: 'Great clarification. Assume a 100:1 read-to-write ratio, 50k writes/sec, and sub-15ms p99 read latency.',
      },
      {
        speaker: 'candidate',
        time: '00:02:40',
        text: 'With a 100:1 read-to-write ratio, our write throughput is 50k/sec while read traffic is 5 million requests per second. This dictates an aggressive caching tier and horizontal database sharding.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f4f4f5]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#090a0f]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <span className="font-bold text-white text-sm">Post-Call Session Intelligence</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors">
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Session Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-r from-emerald-950/20 via-[#12141c] to-[#12141c] p-8 shadow-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                {sessionData.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                {sessionData.duration}
              </span>
              <span>•</span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {sessionData.mode}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{sessionData.title}</h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">{sessionData.summary}</p>
          </div>

          <div className="flex flex-col items-center justify-center h-28 w-28 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-xl flex-shrink-0">
            <span className="text-3xl font-black">{sessionData.score}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Overall Score</span>
          </div>
        </div>

        {/* Rubric Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(sessionData.rubric).map(([metric, value]) => (
            <div key={metric} className="rounded-2xl border border-white/10 bg-[#12141c] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 capitalize">
                  {metric.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-sm font-bold text-emerald-400">{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Observed Strengths
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-300">
              {sessionData.strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Targeted Growth Areas
            </h3>
            <ul className="flex flex-col gap-2.5 text-xs text-zinc-300">
              {sessionData.improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Questions Asked & Evaluated */}
        <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Questions Asked & Candidate Responses ({sessionData.questions.length})
          </h3>

          <div className="flex flex-col gap-4">
            {sessionData.questions.map((q, idx) => (
              <div key={idx} className="rounded-2xl border border-white/5 bg-black/20 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {idx + 1}. {q.question}
                  </h4>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 flex-shrink-0">
                    {q.score}% Score
                  </span>
                </div>

                <div className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <strong className="text-zinc-400">Answer Summary:</strong> {q.candidateAnswer}
                </div>

                <div className="text-xs text-emerald-300/90 leading-relaxed">
                  <strong className="text-emerald-400">AI Feedback:</strong> {q.feedback}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verbatim Transcript Timeline */}
        <div className="rounded-3xl border border-white/10 bg-[#12141c] p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Verbatim Session Transcript
            </h3>
            <span className="text-xs text-zinc-500">{sessionData.transcript.length} turns recorded</span>
          </div>

          <div className="flex flex-col gap-3">
            {sessionData.transcript.map((item, idx) => {
              const isInterviewer = item.speaker === 'interviewer';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                    isInterviewer
                      ? 'bg-purple-950/10 border-purple-500/20 text-zinc-200'
                      : 'bg-emerald-950/10 border-emerald-500/20 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        isInterviewer ? 'text-purple-400' : 'text-emerald-400'
                      }`}
                    >
                      {isInterviewer ? <Headphones className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                      <span>{isInterviewer ? 'Interviewer' : 'You (Candidate)'}</span>
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">{item.time}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
