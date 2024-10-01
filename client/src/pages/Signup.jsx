import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setUser } from "../redux/userSlice";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useDispatch } from "react-redux";
import {
    Baby,
    CircleUserRound,
    Key,
    Mail,
    User,
    Eye,
    EyeOff,
} from "lucide-react";

function SignUpSignInPage({ isSignUp: initialIsSignUp }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSignUp, setIsSignUp] = useState(initialIsSignUp);

    useEffect(() => {
        setIsSignUp(location.pathname === "/signup");
    }, [location]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        gender: "",
        age: "",
        city: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const toggleForm = () => {
        navigate(isSignUp ? "/signin" : "/signup");
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevState) => !prevState);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const url = isSignUp
            ? "http://localhost:5001/signup"
            : "http://localhost:5001/signin";

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                const successMessage = isSignUp
                    ? "Signup successful"
                    : "Signin successful";
                alert(successMessage);

                if (!isSignUp) {
                    dispatch(
                        setUser({
                            name: data.user.name,
                            email: data.user.email,
                            token: data.token,
                            age: data.user.age,
                            gender: data.user.gender,
                            city: data.user.city,
                        })
                    );
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("name", data.user.name);
                    localStorage.setItem("email", data.user.email);
                    navigate("/recommendations");
                } else {
                    navigate("/signin");
                }
            } else {
                alert(data.message || "Something went wrong");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error occurred during the process.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-gradient-to-r from-pink-100 to-purple-100 py-12">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    {isSignUp ? "Sign Up" : "Sign In"}
                </h2>
                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className="mb-4">
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 ml-2"
                            >
                                Name
                            </label>
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                                <User color="#9F2089" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter your name"
                                    required
                                    aria-label="Name"
                                    className="w-full bg-transparent focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 ml-2"
                        >
                            Email
                        </label>
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                            <Mail color="#9F2089" />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                required
                                aria-label="Email"
                                className="w-full bg-transparent focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 ml-2"
                        >
                            Password
                        </label>
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                            <Key color="#9F2089" />
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter your password"
                                required
                                aria-label="Password"
                                className="w-full bg-transparent focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff color="#9F2089" />
                                ) : (
                                    <Eye color="#9F2089" />
                                )}
                            </button>
                        </div>
                    </div>
                    {isSignUp && (
                        <>
                            <div className="mb-4">
                                <label
                                    htmlFor="gender"
                                    className="block text-sm font-medium text-gray-700 ml-2"
                                >
                                    Gender
                                </label>
                                <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                                    <CircleUserRound color="#9F2089" />
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        required
                                        aria-label="Gender"
                                        className="w-full bg-transparent focus:outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label
                                    htmlFor="age"
                                    className="block text-sm font-medium text-gray-700 ml-2"
                                >
                                    Age
                                </label>
                                <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                                    <Baby color="#9F2089" />
                                    <Input
                                        id="age"
                                        name="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={handleInputChange}
                                        placeholder="Enter your age"
                                        required
                                        aria-label="Age"
                                        className="w-full bg-transparent focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label
                                    htmlFor="city"
                                    className="block text-sm font-medium text-gray-700 ml-2"
                                >
                                    City
                                </label>
                                <div className="flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                                    <Baby color="#9F2089" />
                                    <Input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Enter your city"
                                        required
                                        aria-label="City"
                                        className="w-full bg-transparent focus:outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                    <Button
                        type="submit"
                        className={`w-full ${
                            isLoading
                                ? "bg-gray-400"
                                : "bg-pink-500 hover:bg-pink-600"
                        } text-white py-2 rounded-md`}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Processing..."
                            : isSignUp
                            ? "Sign Up"
                            : "Sign In"}
                    </Button>
                </form>
                <div className="text-center mt-6">
                    <button
                        className="text-sm text-pink-500 hover:underline"
                        onClick={toggleForm}
                    >
                        {isSignUp
                            ? "Already have an account? Sign In"
                            : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SignUpSignInPage;