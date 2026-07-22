# Artificial Intelligence Context for "Subastas Ya"

This file is designed for any AI assistant to quickly read and understand the project context, technologies, and rules without having to scan the entire source code, saving time and tokens.

## Project Information
- **Name:** Subastas Ya (subastasya)
- **Description:** Modern auction platform (portfolio/CV project).
- **Deployment:** Vercel (web version), Render, and Supabase (Backend/Auth).
- **Environment:** React Native with **Expo (SDK 54)**.
- **Routing:** Expo Router (File-based routing in the `/app` directory).

## Core Technology Stack
- **Framework:** React Native (0.81.5) + Expo (v54.0.0).
- **Language:** TypeScript.
- **State Management:** Zustand.
- **Security & DB:** Supabase (PostgreSQL, JWT Auth, Storage).
- **Icons:** Lucide React Native / Expo Vector Icons.
- **Animations/Gestures:** React Native Reanimated & React Native Gesture Handler.

## Key Directory Structure
- `/app`: Contains routes and screens (Expo Router).
- `/components`: Reusable UI components.
- `/constants`: Constants, themes, and colors.
- `/hooks`: Custom React hooks.
- `/lib`: Configuration for external services (e.g., Supabase client).
- `/services`: API integration and backend logic.
- `/store`: Zustand configurations for global state (e.g., Auth state).
- `/types`: TypeScript interfaces and type definitions.
- `/assets`: Images, fonts, and static files.

## Development Guidelines & Rules for AI
1. **Expo v54:** IMPORTANT: The app uses Expo SDK 54. All recommendations must be compatible with this version (as stated in `AGENTS.md`).
2. **Web First / Universal:** Because the project is deployed on Vercel, any new code or third-party package must have universal support (guaranteed compatibility for both Web and Mobile). Use `expo-image-picker` instead of native-only alternatives.
3. **Global State & Security:** Use `Zustand` (`/store`) for global state. Secure JWT sessions using `expo-secure-store` and Supabase Auth.
4. **Navigation:** Maintain file-based routing within the `/app` folder. Use `expo-router` components and hooks.
5. **Styling:** Follow modern React Native best practices, keeping styles clean and modularized.

---
**Note to AI:** When assigned a task in this project, strictly adhere to this technology stack and avoid incompatible solutions or dependencies. Keep responses concise and action-oriented!
