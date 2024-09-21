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
                    <Route path="/" element={<MeeshoLandingPage />}></Route>
                    <Route path="/profile" element={<SignUpSignInPage />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
