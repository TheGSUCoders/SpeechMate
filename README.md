# Speech Mate 🎙️

Speech Mate is an AI-powered public speaking coach designed to help you write, practice, and perfect your speeches. From generating an outline to analyzing your final performance, Speech Mate is your all-in-one partner for confident communication.

## Key Features

* **AI-Powered Speech Generation:** Generate a detailed, structured speech outline in seconds. Just provide a topic, tone, audience, and desired duration, and let our AI build your speech.
* **Multimodal Performance Analysis:** Upload a video of your speech—along with your slides, notes, or any other materials—and receive a comprehensive, AI-driven report.
* **Detailed Feedback:** Get an overall score and detailed breakdowns on:
    * **Content & Structure:** How well you stayed on topic and organized your ideas.
    * **Delivery & Body Language:** Analysis of your posture, gestures, and eye contact.
    * **Vocal Variety:** Feedback on your pace, pitch, tone, and intonation.
    * **Filler Word Counting:** A precise count of "ums," "ahs," "likes," etc.
    * **Accent & Clarity:** Constructive analysis of your pronunciation and language.
* **Actionable Improvement Plan:** Receive specific, actionable tips and a list of recommended YouTube videos tailored to your unique weaknesses.
* **Text-to-Speech Practice:** Listen to your generated speech with a realistic AI voice (powered by ElevenLabs) to practice your timing and cadence.
* **Secure Authentication:** User accounts are secured via Google OAuth 2.0.

## How It Works

Speech Mate is a full-stack application composed of a React frontend and a Spring Boot backend.

1.  **Authentication:** The user logs in using their Google account. The Spring Boot backend uses Spring Security and OAuth2 to authenticate the user and establish a session.
2.  **Speech Generation:**
    * A user fills out the "Generate Speech" form in the React UI.
    * This calls the `/api/gemini/generate-outline` endpoint on the Spring Boot server.
    * The `GeminiService` constructs a detailed prompt for the **Gemini 2.0 Flash** model, asking it to return a structured JSON object containing a title, thesis, timed sections, talking points, and a conclusion.
3.  **Speech Analysis:**
    * A user uploads a video file and/or other documents (PDFs, images).
    * This calls the `/api/gemini/analyze-speech` endpoint with `multipart/form-data`.
    * The `GeminiService` uses the powerful **Gemini 2.5 Pro** multimodal model. It combines the video, slides, and user-provided context (topic, audience) into a single, comprehensive prompt.
    * This prompt instructs the AI to act as an expert speech coach and return a highly detailed JSON object with scores, content summaries, language/accent analysis, intonation patterns, filler word counts, specific statement-by-statement feedback, and YouTube recommendations.
    * The React frontend (`SpeechAnalysis.tsx`) parses this complex JSON response and displays it in a user-friendly report.
4.  **Speech Practice:**
    * The user can send text to the `/api/elevenlabs/text-to-speech` endpoint.
    * The backend calls the ElevenLabs API to generate high-quality audio, which the user can play back to practice their delivery.

## Technology Stack

* **Backend:** Java 21, Spring Boot 3.5.7, Spring Security (OAuth2), Spring WebFlux (`WebClient`)
* **Frontend:** React 19, TypeScript, Vite, React Router, Axios, Framer Motion
* **AI APIs:** Google Gemini (2.5 Pro, 2.0 Flash, 2.0 Flash-Lite), ElevenLabs
* **Authentication:** Google OAuth 2.0
