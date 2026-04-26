import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Incidents from "./pages/Incidents";
import Conservation from "./pages/Conservation";
import Approvals from "./pages/Approvals";
import { setAuthTokenProvider } from "./services/api";

const AuthBootstrap = ({ children }) => {
	const { isLoaded, getToken } = useAuth();

	useEffect(() => {
		if (!isLoaded) return;
		setAuthTokenProvider(() => getToken());
	}, [getToken, isLoaded]);

	if (!isLoaded) return null;
	return <>{children}</>;
};

const ProtectedRoute = ({ children }) => (
	<>
		<SignedIn>
			<AuthBootstrap>{children}</AuthBootstrap>
		</SignedIn>
		<SignedOut>
			<RedirectToSignIn />
		</SignedOut>
	</>
);

const App = () => (
	<Router>
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/login" element={<Login />} />
			<Route path="/signup" element={<Signup />} />
			<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
			<Route path="/sites" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
			<Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
			<Route path="/conservation" element={<ProtectedRoute><Conservation /></ProtectedRoute>} />
			<Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
		</Routes>
	</Router>
);

export default App;
