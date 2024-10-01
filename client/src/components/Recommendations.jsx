import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { IndianRupee, Star } from "lucide-react";

function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const user = useSelector((state) => state.user);
    const observer = useRef();

    const lastProductElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/initial-recommendation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: user.email || '',
                    name: user.name || '',
                    age: user.age || 0,
                    gender: user.gender || 'unspecified',
                    city: user.city || '',
                    page: page
                }),
            });
            const data = await response.json();
            setRecommendations(prev => [...prev, ...data]);
            setHasMore(data.length > 0);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.email) {
            fetchRecommendations();
        }
    }, [user, page]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Recommended Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendations.map((product, index) => (
                    <div 
                        key={index} 
                        ref={index === recommendations.length - 1 ? lastProductElementRef : null}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                        <div className="relative pb-[100%]">
                            <img 
                                src={product['Image URL']}
                                alt={product.Title}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 truncate">{product.Title}</h3>
                            <p className="text-pink-500 font-bold flex items-center">
                                <IndianRupee className="w-4 h-4 mr-1" />
                                {product.Price}
                            </p>
                            <div className="flex items-center mt-2">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span>{product.Rating}</span>
                                <span className="text-gray-500 text-sm ml-2">({product.Reviews} reviews)</span>
                            </div>
                            <a 
                                href={product['Product URL']} 
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
            {loading && <div className="text-center py-4">Loading more products...</div>}
            {!hasMore && <div className="text-center py-4">No more products to load</div>}
        </div>
    );
}

export default Recommendations;