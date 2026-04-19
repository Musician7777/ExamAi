# ExamAI - Project Documentation

## 1. Project Overview & Flow

ExamAI is a Next.js application (using the App Router) designed to provide AI-generated mock exams, coding challenges, and mock interviews.

**Application Flow:**

- **Authentication**: Users authenticate (likely via `next-auth` using Credentials or Google OAuth as seen in the `User` model).
- **Dashboard (`/dashboard`)**: The central hub where users can access features:
  - **Generate Exam (`/dashboard/generate`)**: Users select a preset exam (like UPSC, Software Engineering, etc.) or create a custom exam.
  - **Live Exam (`/dashboard/exam/live`)**: Takes the generated JSON and presents it as a timed, interactive test.
  - **Coding (`/dashboard/coding`)**: In-browser code editor for programming challenges.
  - **Interview (`/dashboard/interview`)**: AI-driven mock interviews.
  - **Analytics (`/dashboard/analytics`)**: Visualizes user performance across all past activities.
- **Data Layer**: MongoDB is used to persist data. The `Activity` model stores every test result (exam, coding, interview) with the user's score, total marks, and details about the difficulty or topic.

## 2. Core Feature: Exam Generation

Exam generation is powered by the Google Gemini AI (`@google/generative-ai`), specifically the `gemini-2.5-flash` model.

### How it works:

1. **User Interface (`app/dashboard/generate/page.js`)**:
   - The user selects a preset (e.g., "UPSC CSE", "Software Eng.") or configures a custom exam (setting the number of questions, sections, difficulty distribution, and negative marking).
   - Upon clicking "Generate", a POST request is sent to the `/api/gemini` endpoint with the configuration.

2. **API Logic & AI Prompting (`app/api/gemini/route.js`)**:
   - The endpoint receives the configuration and constructs a highly detailed prompt.
   - For preset exams, it uses hardcoded "Exam Profiles" containing exact sections, topics, exam style, and negative marking rules.
   - _Example prompt injection_: "You are an expert exam paper setter for UPSC... Generate a realistic, high-quality exam paper with EXACTLY 20 questions... Return a JSON object with this EXACT structure..."
   - **Failover & Reliability**: The API implements a robust failover mechanism. It maintains an array of API keys. If one key hits a rate limit (HTTP 429), it implements exponential backoff retries. If the limit persists, it automatically switches to the next available API key.
   - The AI responds with a structured JSON containing the sections, questions, options, correct indices, and educational explanations.

3. **Client Handoff**: The structured JSON is returned to the client, stored securely in `sessionStorage`, and the user is redirected to the live test environment.

## 3. Core Feature: Analytics

The analytics dashboard provides users with actionable insights based on their past activities.

### How it works:

1. **Data Fetching (`app/dashboard/analytics/page.js`)**:
   - The page calls the `/api/activities` endpoint to fetch up to 50 recent activities for the logged-in user. Included in these activities are exam scores, coding test results, and interview evaluations.
2. **Data Aggregation**:
   - The frontend processes this array of activities. It maps scores to percentages, categorized by topics (Coding, Exams, Interviews), and difficulty tiers (Easy, Medium, Hard).
   - Dynamic insights are calculated (e.g., finding the "Best Topic" by averaging scores per category).

3. **Data Visualization (`Chart.js` & `react-chartjs-2`)**:
   - **Score Trend (Line Chart)**: Plots the chronological progression of the user's overall scores across all activities.
   - **Topic-wise Accuracy (Radar Chart)**: Compares average accuracy across different domains (Coding vs. Exams vs. Interviews).
   - **Score Distribution (Bar Chart)**: Groups past scores into buckets (0-20%, 21-40%, etc.) to show consistency.
   - **Performance Breakdown (Doughnut Chart)**: Visualizes the proportion of High, Medium, and Low performances based on difficulty or percentage limits.

## 4. Key External Libraries

The project leverages the following major libraries (as defined in `package.json`):

- **`next` & `react`**: The core framework and UI library (version 16 / React 19).
- **`@google/generative-ai`**: The Google SDK used exclusively for querying the Gemini LLM to generate exams, evaluate coding solutions, and conduct mock interviews.
- **`mongoose`**: The MongoDB ODM used to interact with the database (creating `User` and `Activity` documents).
- **`chart.js` & `react-chartjs-2`**: Used for rendering the responsive, interactive charts on the analytics dashboard.
- **`next-auth`**: Handles secure user authentication flows (Credentials & Google OAuth).
- **`bcryptjs`**: Used for hashing user passwords before storing them in the database.
- **`@monaco-editor/react`**: Provides the rich, VS Code-like coding environment used in the coding challenges section.
- **`react-icons`**: Supplies the SVG icons used consistently across the dashboard UI.
