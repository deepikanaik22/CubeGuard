
# CubeSense - AI-Powered CubeSat Monitoring Dashboard

CubeSense is a Next.js web application designed for real-time monitoring and anomaly detection for CubeSats. It provides a user-friendly dashboard to visualize telemetry data, receive alerts for critical conditions, and leverage AI to assess and explain potential risks.

## Features

- **Live Telemetry Dashboard**: An overview page displaying a snapshot of the latest satellite telemetry, including battery levels, temperature, and communication status.
- **AI Anomaly Risk Score**: Utilizes an AI model (via OpenRouter) to calculate an anomaly risk score based on current telemetry data.
- **AI-Powered Explanations**: Provides detailed AI-generated explanations for the calculated anomaly risk scores, breaking down contributing factors (thermal, communication, power, orientation).
- **Detailed Telemetry View**: A dedicated page showing comprehensive telemetry data across various subsystems:
    - Power System (Battery Voltage, Solar Panel Output)
    - Thermal System (Internal & External Temperatures)
    - Orientation (Gyroscope, Magnetometer)
    - Communication (Signal Strength, Packet Delay)
- **Alerts System**: Dynamically generates and displays alerts for critical and warning conditions based on predefined thresholds for telemetry data.
- **Communication Status**: A page focused on communication link quality, including signal strength, packet delay, and last contact time.
- **Satellite Selection**: Allows users to switch between different simulated CubeSats to monitor their individual data streams.
- **Responsive Design**: Built with ShadCN UI and Tailwind CSS for a modern, responsive user interface that works on desktop and mobile devices.
- **Client-Side Data Simulation**: Simulates real-time telemetry updates for demonstration purposes.

## Tech Stack

- **Frontend**:
    - [Next.js](https://nextjs.org/) (v15+ with App Router)
    - [React](https://reactjs.org/) (v18+)
    - [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**:
    - [ShadCN UI](https://ui.shadcn.com/) (Component library)
    - [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    - [Lucide React](https://lucide.dev/) (Icons)
- **AI & Machine Learning**:
    - [OpenRouter](https://openrouter.ai/) (Access to various LLMs, currently configured for GPT-3.5-Turbo)
    - [Genkit](https://firebase.google.com/docs/genkit) (Framework for building AI-powered features - initial setup present)
    - [Zod](https://zod.dev/) (Schema declaration and validation for AI inputs/outputs)
- **State Management**:
    - React Context API (for satellite selection)
- **Data Handling & Simulation**:
    - Client-side telemetry simulation (`src/services/telemetry.ts`)
    - [Firebase](https://firebase.google.com/) (Firestore client setup present in `src/lib/firebase.ts`, though not fully integrated for telemetry persistence yet)
- **Development Tools**:
    - ESLint, Prettier (implicitly, common in Next.js projects)

## Project Structure

- `src/app/`: Next.js App Router pages (e.g., `/`, `/telemetry`, `/alerts`).
- `src/components/`: Reusable UI components, including ShadCN UI components.
- `src/ai/`:
    - `ai-instance.ts`: Configuration for AI model access (e.g., OpenRouter).
    - `flows/`: Server-side AI logic/flows (e.g., `explain-anomaly-score.ts`, `get-risk-score.ts`).
- `src/context/`: React context for global state management (e.g., `SatelliteContext.tsx`).
- `src/hooks/`: Custom React hooks (e.g., `use-toast.ts`, `use-mobile.ts`).
- `src/lib/`: Utility functions and library configurations (e.g., `utils.ts`, `firebase.ts`).
- `src/services/`: Data fetching and business logic (e.g., `telemetry.ts` for simulated data).
- `src/shared/`: Shared schemas and types (e.g., `anomalySchemas.ts`).
- `public/`: Static assets.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, yarn, or pnpm

### Environment Variables

Create a `.env` file in the root of the project and add the following environment variables. Replace the placeholder values with your actual keys.

```env
# OpenRouter API Key (Required for AI features)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Firebase Public Config (Required if you plan to integrate Firebase services)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Google AI API Key (If you plan to use Google GenAI models directly via Genkit in other flows)
# GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
# GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The application currently relies heavily on `OPENROUTER_API_KEY` for its AI functionalities. Ensure this is correctly set up.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Running the Development Server

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will typically be available at `http://localhost:3001`.

The Genkit development server can be run alongside if you are developing Genkit flows:
```bash
npm run genkit:dev
# or to watch for changes
npm run genkit:watch
```

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Starting the Production Server

After building, you can start the production server:

```bash
npm run start
# or
yarn start
# or
pnpm start
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or improvements.

## License

This project is licensed under the MIT License. 
