import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MeeshoLandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import SignUpSignInPage from "./pages/Signup";

function App() {
    return (
        <>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/" element={<MeeshoLandingPage />} />
                    <Route
                        path="/signin"
                        element={<SignUpSignInPage isSignUp={false} />}
                    />
                    <Route
                        path="/signup"
                        element={<SignUpSignInPage isSignUp={true} />}
                    />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
