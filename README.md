# Euboulos AI — Voice Interview Preparation

An AI-powered interview practice platform where candidates **speak their answers, receive instant feedback, and practise adaptive follow-up questions**. Built with React, FastAPI, OpenAI, and LangGraph.

## Key Features

- **Voice-based interviews:** AI-generated spoken questions and spoken-answer capture.
- **AI answer evaluation:** Scores answers from 0–100 with summaries, strengths, and actionable improvements.
- **Adaptive follow-ups:** Generates subsequent interview questions based on the candidate’s responses.
- **Structured practice:** 15 modules and 75 topics spanning Software Engineering and Product Management, with Easy, Medium, and Hard difficulty levels.
- **Progress analytics:** Tracks average scores, answered questions, module activity, and topic-level improvement areas.
- **Interview history:** Review previous sessions, replay question and answer audio, and revisit feedback.
- **Secure authentication:** Account registration, login, profile management, and refresh-token-based session handling.

## How It Works

Each interview step is orchestrated by a LangGraph workflow. Independent AI tasks run in parallel where possible, and the results are persisted after processing.

## Tech Stack

| Layer              | Technologies                                      |
| ------------------ | ------------------------------------------------- |
| Frontend           | React, TypeScript, Vite, Chakra UI, Framer Motion |
| Backend            | Python, FastAPI, asynchronous request handling    |
| Database           | MongoDB Atlas                                     |
| AI & Orchestration | OpenAI, LangGraph                                 |
| API Communication  | Axios, REST APIs                                  |
