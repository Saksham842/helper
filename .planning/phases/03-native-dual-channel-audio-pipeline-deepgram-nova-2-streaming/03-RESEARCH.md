# Phase 3: Native Dual-Channel Audio Pipeline & Deepgram Nova-2 Streaming - Research

## Architectural Deep Dive & Design Patterns

### 1. Undetected System Loopback Audio Capture (Interviewer Stream)
- **The Problem**:
  - In a standard browser, capturing system audio requires `navigator.mediaDevices.getDisplayMedia({ audio: true })`, which displays an un-hidable OS recording banner ("Google Meet is sharing your screen") and triggers browser blur events.
- **The Native Solution in Electron**:
  - In Electron 30+, `desktopCapturer` combined with `session.defaultSession.setDisplayMediaRequestHandler` allows silent loopback capture without prompt dialogs or recording banners:
    ```ts
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        // Automatically approve loopback audio without UI prompt
        callback({ video: sources[0], audio: 'loopback' });
      });
    });
    ```
  - In the renderer process:
    ```ts
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
        },
      } as any,
      video: false,
    });
    ```
  - This captures WASAPI Loopback on Windows and CoreAudio on macOS completely silently, with zero visible banners.

### 2. Candidate Microphone Capture (Candidate Stream)
- Captured via standard high-fidelity audio constraints:
  ```ts
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
    },
    video: false,
  });
  ```

### 3. Dual-Channel Hardware Diarization vs Algorithmic Diarization
- **Why Multi-Channel Hardware Separation is Superior**:
  - Standard algorithmic diarization processes a single mixed audio track and tries to guess speaker shifts using acoustic embeddings, frequently misclassifying the interviewer as the candidate.
  - Multi-channel audio sends:
    - **Channel 0 (Left)**: Pure system loopback (Interviewer).
    - **Channel 1 (Right)**: Pure microphone (Candidate).
  - Deepgram Nova-2 supports `multichannel=true&channels=2`.
  - Result: Deepgram transcribes Channel 0 with `speaker: 0` (Interviewer) and Channel 1 with `speaker: 1` (Candidate) with 100% deterministic precision.

### 4. Audio Pipeline & PCM Conversion
- Deepgram Nova-2 requires linear16 PCM at 16,000 Hz.
- An `AudioContext` running at 16,000 Hz combines both streams using a `ChannelMergerNode(2)`:
  - Input 0: Loopback Audio -> Merger Input 0 (Left Channel)
  - Input 1: Microphone Audio -> Merger Input 1 (Right Channel)
- An `AudioWorklet` (or PCM processor) buffers 100ms frames (1600 samples * 2 channels = 3200 16-bit integers = 6400 bytes) and streams binary chunks over the WebSocket.

### 5. Deepgram Nova-2 Live WebSocket Client
- Endpoint:
  `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&diarize=true&multichannel=true&encoding=linear16&sample_rate=16000&channels=2`
- Authentication via `Authorization: Token <DEEPGRAM_API_KEY>`.
- Supports live interim transcripts (`is_final: false`) for instant visual feedback (<300ms) and finalized utterances (`is_final: true`) for AI question detection.
- Resilient connection manager with exponential backoff reconnect and keep-alive ping frames.

### 6. HUD Live Transcript Feed
- Displays color-coded speaker badges:
  - **Interviewer (Caller)**: Purple badge `#a855f7`
  - **Candidate (You)**: Emerald badge `#10b981`
- Auto-scrolling transcript timeline with timestamps and interim typing animation.
