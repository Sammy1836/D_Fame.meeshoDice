import React, { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/Button";

const categories = [
    "Women Ethnic",
    "Women Western",
    "Men",
    "Kids",
    "Home & Kitchen",
    "Beauty & Health",
    "Jewellery & Accessories",
    "Bags & Footwear",
    "Electronics",
];

function MeeshoLandingPage() {
    const [mensData, setMensData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    "https://super-paint-flamingo.glitch.me/MensData"
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const data = await response.json();
                setMensData(data);
            } catch (error) {
                // setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <nav className="bg-white border-b">
                <div className="container mx-auto px-4 py-2 overflow-x-auto">
                    <ul className="flex space-x-6 whitespace-nowrap">
                        {categories.map((category, index) => (
                            <li key={index}>
                                <a
                                    href="#"
                                    className="text-sm hover:text-pink-500"
                                >
                                    {category}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            <main className="flex-grow">
                <section className="bg-gradient-to-r from-pink-100 to-purple-100 py-12">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-4xl font-bold mb-4">
                            Lowest Prices <br className="hidden md:inline" />
                            Best Quality Shopping
                        </h1>
                        <div className="flex justify-center items-center space-x-4 mb-8">
                            <span className="flex items-center space-x-2">
                                <img
                                    src="https://images.meesho.com/images/pow/freeDelivery_jamun.svg"
                                    alt="Icon"
                                    className="h-8 w-8"
                                />
                                <span>Free Delivery</span>
                            </span>
                            <span className="flex items-center space-x-2">
                                <img
                                    src="https://images.meesho.com/images/pow/cod_jamun.svg"
                                    alt="Icon"
                                    className="h-8 w-8"
                                />
                                <span>Cash on Delivery</span>
                            </span>
                            <span className="flex items-center space-x-2">
                                <img
                                    src="https://images.meesho.com/images/pow/easyReturns_jamun.svg"
                                    alt="Icon"
                                    className="h-8 w-8"
                                />
                                <span>Easy Returns</span>
                            </span>
                        </div>
                        <Button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-md">
                            Download the Meesho App
                        </Button>
                    </div>
                </section>

                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold mb-6">
                            Top Categories to choose from
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categories.slice(0, 8).map((category, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-100 rounded-lg p-4 text-center"
                                >
                                    <img
                                        src={`/placeholder.svg?height=150&width=150&text=${category}`}
                                        alt={category}
                                        className="w-full h-40 object-cover rounded-md mb-2"
                                    />
                                    <p className="font-semibold">{category}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-12">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold mb-6">
                            All Products
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {mensData.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-2">
                                            {product.title}
                                        </h3>
                                        <p className="text-pink-500 font-bold">
                                            <div className="flex items-center">
                                                <IndianRupee /> {product.price}
                                            </div>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-gray-100 py-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="font-bold mb-4">
                                Shop Non-Stop on Meesho
                            </h3>
                            <p className="text-sm text-gray-600">
                                Trusted by more than 1 Crore Indians
                            </p>
                            <p className="text-sm text-gray-600">
                                Cash on Delivery | Free Delivery
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-4">Careers</h3>
                            <p className="text-sm text-gray-600">
                                Become a supplier
                            </p>
                            <p className="text-sm text-gray-600">
                                Hall of Fame
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-4">
                                Legal and Policies
                            </h3>
                            <p className="text-sm text-gray-600">
                                Terms & Conditions
                            </p>
                            <p className="text-sm text-gray-600">
                                Privacy Policy
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-4">Contact Us</h3>
                            <p className="text-sm text-gray-600">
                                query@meesho.com
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default MeeshoLandingPage;
