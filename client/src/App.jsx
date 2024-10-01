import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MeeshoLandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import SignUpSignInPage from "./pages/Signup";
import Recommendations from "./components/Recommendations";

function App() {
    const user = useSelector((state) => state.user);

    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/" element={<MeeshoLandingPage />} />
                <Route
                    path="/signin"
                    element={
                        user.email ? (
                            <Navigate to="/recommendations" replace />
                        ) : (
                            <SignUpSignInPage isSignUp={false} />
                        )
                    }
                />
                <Route
                    path="/signup"
                    element={
                        user.email ? (
                            <Navigate to="/recommendations" replace />
                        ) : (
                            <SignUpSignInPage isSignUp={true} />
                        )
                    }
                />
                <Route
                    path="/recommendations"
                    element={
                        user.email ? (
                            <Recommendations />
                        ) : (
                            <Navigate to="/signin" replace />
                        )
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;