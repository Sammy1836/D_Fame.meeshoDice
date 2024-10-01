import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/userSlice";
import {
    Search,
    ShoppingBag,
    User,
    Menu,
    IndianRupee,
    ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { NavLink } from "react-router-dom";

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dispatch = useDispatch();
    const { name, email } = useSelector((state) => state.user);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedName = localStorage.getItem("name");
        const storedEmail = localStorage.getItem("email");

        if (token && storedName && storedEmail) {
            dispatch(setUser({ name: storedName, email: storedEmail, token }));
        }
    }, [dispatch]);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        dispatch(clearUser());
        setIsDropdownOpen(false);
        // Redirect to home page after sign out
        window.location.href = "/";
    };

    return (
        <nav>
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Menu className="h-6 w-6 md:hidden" />
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                isActive ? "activeTab" : "tab"
                            }
                        >
                            <img
                                src="https://www.meesho.com/assets/svgicons/meeshoLogo.svg"
                                alt="Meesho Logo"
                                className="h-10"
                            />
                        </NavLink>
                        <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-md p-2">
                            <Search className="h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Try Saree, Kurti or Search by Product Code"
                                className="bg-transparent border-none focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Profile Dropdown Section */}
                    <nav className="hidden md:flex items-center space-x-6 relative">
                        <div className="relative">
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center space-x-2 focus:outline-none"
                            >
                                <User className="h-5 w-5" />
                                <span>{name || "Profile"}</span>
                                <ChevronDown className="h-4 w-4" />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                                    {name ? (
                                        <>
                                            <div className="px-4 py-2 border-b">
                                                <p className="text-gray-700">
                                                    {name}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <NavLink
                                                to="/signin"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                Sign In
                                            </NavLink>
                                            <NavLink
                                                to="/signup"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                                            >
                                                Sign Up
                                            </NavLink>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>
        </nav>
    );
};

export default Navbar;
