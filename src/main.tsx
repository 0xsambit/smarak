import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!PUBLISHABLE_KEY) {
	throw new Error("Add your Clerk Publishable Key to the .env file");
}

if (!API_BASE_URL) {
	throw new Error("Add VITE_API_BASE_URL to the .env file (see .env.example)");
}

try {
	new URL(API_BASE_URL);
} catch {
	throw new Error("VITE_API_BASE_URL must be a valid absolute URL");
}

if (import.meta.env.PROD && PUBLISHABLE_KEY.startsWith("pk_test_")) {
	throw new Error("Production build requires a live Clerk publishable key (pk_live_*)");
}

if (import.meta.env.PROD && !API_BASE_URL.startsWith("https://")) {
	throw new Error("Production build requires an HTTPS VITE_API_BASE_URL");
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
			<App />
		</ClerkProvider>
	</StrictMode>,
);
