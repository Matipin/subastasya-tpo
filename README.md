# 🔨 Subastas Ya

Welcome to **Subastas Ya**! A modern, fast, and multi-platform auction platform.

This project is built as a Universal Application (iOS, Android, Web) using the **React Native** and **Expo** ecosystem. The web version is continuously deployed and hosted on **Vercel**, while the backend and security architecture are powered by **Supabase**.

## 🚀 Technologies Used

The application is built using a modern and highly scalable stack:

- **[React Native](https://reactnative.dev/) & [Expo](https://expo.dev/):** Main framework for universal development (Web and Mobile). Running on Expo SDK 54.
- **[Expo Router](https://docs.expo.dev/router/introduction/):** Declarative, file-based routing system.
- **[Supabase](https://supabase.com/):** Backend-as-a-Service providing PostgreSQL, Authentication (JWT), and Storage.
- **[Zustand](https://github.com/pmndrs/zustand):** Global state management; lightweight, fast, and boilerplate-free.
- **[TypeScript](https://www.typescriptlang.org/):** Ensures a typed and robust codebase, reducing runtime errors.
- **[Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/):** Provide smooth 60fps animations and complex touch interactions.
- **[Lucide Icons](https://lucide.dev/) / Expo Vector Icons:** Clean and optimized iconography for mobile apps.

## 📁 Project Structure

The source code is organized as follows to ensure maintainability and scalability:

- `/app` - Screens and routing structure (Expo Router).
- `/components` - Reusable and atomic UI components.
- `/store` - Global state management using Zustand (including Auth flows).
- `/services` - External API integrations and backend logic.
- `/lib` - Service configurations (e.g., Supabase client).
- `/hooks` - Custom React hooks encapsulating component logic.
- `/types` - Global TypeScript types and interfaces.
- `/constants` - Configuration variables, color palettes, and themes.

## 🌐 Deployment (Vercel)

The web version of this project is automatically deployed via **Vercel**. Every change merged into the main branch triggers a fast build and deployment, ensuring users always have access to the latest version without additional configuration.

---
*Developed with passion to provide the best online auction experience.*
