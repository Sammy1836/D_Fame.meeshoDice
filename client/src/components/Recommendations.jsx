import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IndianRupee } from "lucide-react";

function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector((state) => state.user);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/initial-recommendation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: user.email }),
                });
                const data = await response.json();
                setRecommendations(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                setLoading(false);
            }
        };

        if (user.email) {
            fetchRecommendations();
        }
    }, [user]);

    if (loading) {
        return <div className="text-center py-8">Loading recommendations...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Recommended Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                    <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="relative pb-[100%]">
                            <img 
                                src={product.product_image_url}
                                alt={product.product_details}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 truncate">{product.product_details}</h3>
                            <p className="text-pink-500 font-bold flex items-center">
                                <IndianRupee className="w-4 h-4 mr-1" />
                                {product.price || 'N/A'}
                            </p>
                            <a 
                                href={product.product_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-3 block w-full bg-pink-500 text-white py-2 text-center rounded-md hover:bg-pink-600 transition-colors duration-300"
                            >
                                View Product
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Recommendations;