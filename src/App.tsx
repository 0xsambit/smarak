import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import type { ReactNode } from "react";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Incidents from "./pages/Incidents";
import Conservation from "./pages/Conservation";
import Approvals from "./pages/Approvals";

type ProtectedRouteProps = {
	children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
	return (
		<>
			<SignedIn>{children}</SignedIn>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
};

const App = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/sites"
					element={
						<ProtectedRoute>
							<Sites />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/incidents"
					element={
						<ProtectedRoute>
							<Incidents />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/conservation"
					element={
						<ProtectedRoute>
							<Conservation />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/approvals"
					element={
						<ProtectedRoute>
							<Approvals />
						</ProtectedRoute>
					}
				/>
			</Routes>
		</Router>
	);
};

export default App;
