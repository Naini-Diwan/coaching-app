# Diwan Sir - Spoken English Classes 
A full-featured web portal designed for **Diwan Sir Spoken English Classes**. Built with **Vue 3**, **Vite**, and **TypeScript**.


## Features

### Role-Based Access Control
* **Instructor Dashboard:**
  * Register new student profiles directly with instant credentials.
  * Real-time metrics tracking: total student count, unresolved doubts, online vs. offline breakdown, and scheduled slots.
  * Attendance tracker: select any date to mark students Present, Absent, or reset records.
  * Doubt clearing: review questions asked by students and post written explanations.
  * Class scheduling: publish and edit upcoming live class time slots.
  * Study material & idiom deck management: add, edit, delete, or toggle public vs. enrolled-only visibility.
  * Evaluate speaking practice videos uploaded by students and deliver personalized feedback.
* **Student Dashboard:**
  * Attendance tracker displaying personal attendance rate percentage and present/absent logs[cite: 12].
  * View upcoming live class timings scheduled by the instructor[cite: 12].
  * Submit private questions/doubts and view published solutions[cite: 12].
  * Submit speaking practice video links (YouTube, Google Drive) with descriptions to receive personalized feedback[cite: 11].
* **Unregistered User:**
  * Access public announcements and feed notifications.
  * Browse public pronunciation, grammar, vocabulary, and idiom learning decks.



## Tech Stack

* **Frontend:** Vue 3 (`<script setup lang="ts">`), TypeScript, Vite
* **Styling & UI:** Bootstrap 5, Bootstrap Icons
* **Backend & Database:** Supabase (Auth, PostgreSQL Database, Realtime)
* **Hosting & CI/CD:** GitHub Pages with GitHub Actions

---

## Database Architecture (Supabase)

The database schema utilizes UUID keys linked to Supabase Auth (`auth.users`):

| Table | Description | Primary Key | References |
|---|---|---|---|
| `profiles` | Student and instructor metadata (name, role, username) | `uuid` | `auth.users(id)` |
| `attendance` | Daily attendance log records | `bigint` | `profiles(id)` |
| `announcements` | Announcements with audience visibility filters | `bigint` | — |
| `doubts` | Student doubts and instructor solutions | `bigint` | `profiles(id)` |
| `schedules` | Live class scheduling slots | `bigint` | — |
| `practice_materials` | Pronunciation, grammar, and vocabulary guides | `bigint` | — |
| `practice_videos` | Student speaking practice submissions and feedback | `bigint` | `auth.users(id)` |
| `idioms_phrases` | Idioms and phrasal verbs flashcard deck | `bigint` | — |

# Author
© 2026 [Naini Diwan](https://naini-diwan.github.io/Hello-Naini/). All rights reserved.