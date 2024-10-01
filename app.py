from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
# Import necessary libraries
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from surprise import Dataset, Reader, SVD

# 1. Load Data

# User Data
user_data = pd.DataFrame({
    'user_id': [1, 2, 3, 4, 5],
    'age': [25, 30, 22, 35, 28],
    'gender': ['Male', 'Female', 'Male', 'Female', 'Male'],
    'location': ['CityA', 'CityB', 'CityA', 'CityC', 'CityB']
})

# Encode categorical variables
user_data_encoded = pd.get_dummies(user_data, columns=['gender', 'location'])

# Segment users
demographic_features = user_data_encoded.drop('user_id', axis=1)
kmeans = KMeans(n_clusters=2, random_state=42)
user_data['segment'] = kmeans.fit_predict(demographic_features)

# Interaction Data
interaction_data = pd.DataFrame({
    'user_id': [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
    'product_id': [101, 102, 102, 103, 101, 104, 105, 103, 104, 105],
    'interaction_type': ['view', 'click', 'purchase', 'view', 'click', 'view', 'purchase', 'click', 'view', 'click'],
    'rating': [5, 4, 5, 3, 4, 2, 5, 4, 3, 4]
})

# Merge user segments with interaction data
interaction_data = interaction_data.merge(user_data[['user_id', 'segment']], on='user_id')

# Product Data
product_data = pd.DataFrame({
    'product_id': [101, 102, 103, 104, 105],
    'category': ['Electronics', 'Clothing', 'Home', 'Electronics', 'Clothing'],
    'brand': ['BrandX', 'BrandY', 'BrandZ', 'BrandY', 'BrandX'],
    'price_range': ['High', 'Medium', 'Low', 'Medium', 'Low']
})

# Create combined features
product_data['combined_features'] = product_data['category'] + ' ' + product_data['brand'] + ' ' + product_data['price_range']

# 2. Prepare Models

# TF-IDF Matrix
tfidf = TfidfVectorizer()
tfidf_matrix = tfidf.fit_transform(product_data['combined_features'])

# Collaborative Filtering Model
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(interaction_data[['user_id', 'product_id', 'rating']], reader)
trainset = data.build_full_trainset()
algo = SVD()
algo.fit(trainset)

# Popular Products per Segment
popular_products = interaction_data.groupby(['segment', 'product_id']).size().reset_index(name='counts')
top_products_per_segment = popular_products.sort_values(['segment', 'counts'], ascending=False).groupby('segment').head(2)

# 3. Define Functions

def recommend_demographic(user_segment, top_products_per_segment, num_recommendations=2):
    recommendations = top_products_per_segment[top_products_per_segment['segment'] == user_segment]['product_id'].head(num_recommendations)
    return recommendations.tolist()

def build_user_profile(user_id):
    user_interactions = interaction_data[interaction_data['user_id'] == user_id]
    interacted_product_ids = user_interactions['product_id'].unique()
    product_indices = product_data[product_data['product_id'].isin(interacted_product_ids)].index
    user_tfidf_matrix = tfidf_matrix[product_indices]
    user_profile = user_tfidf_matrix.mean(axis=0)
    return user_profile

def recommend_content_based(user_id, num_recommendations=2):
    user_profile = build_user_profile(user_id)
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(user_profile, tfidf_matrix).flatten()
    similar_indices = similarities.argsort()[::-1]
    recommended_product_ids = product_data.iloc[similar_indices]['product_id']
    interacted_product_ids = interaction_data[interaction_data['user_id'] == user_id]['product_id'].unique()
    recommendations = recommended_product_ids[~recommended_product_ids.isin(interacted_product_ids)].head(num_recommendations)
    return recommendations.tolist()

def recommend_collaborative(user_id, num_recommendations=2):
    product_ids = product_data['product_id'].tolist()
    interacted_products = interaction_data[interaction_data['user_id'] == user_id]['product_id'].unique()
    products_to_predict = [pid for pid in product_ids if pid not in interacted_products]
    predictions = [algo.predict(user_id, pid) for pid in products_to_predict]
    predictions.sort(key=lambda x: x.est, reverse=True)
    top_predictions = predictions[:num_recommendations]
    recommendations = [pred.iid for pred in top_predictions]
    return recommendations

def hybrid_recommendation(user_id, user_segment, num_recommendations=3):
    demographic_recs = recommend_demographic(user_segment, top_products_per_segment, num_recommendations*2)
    content_recs = recommend_content_based(user_id, num_recommendations*2)
    collaborative_recs = recommend_collaborative(user_id, num_recommendations*2)
    recs = pd.DataFrame({'product_id': demographic_recs + content_recs + collaborative_recs})
    recs['score'] = 0
    recs.loc[recs['product_id'].isin(demographic_recs), 'score'] += 1
    recs.loc[recs['product_id'].isin(content_recs), 'score'] += 2
    recs.loc[recs['product_id'].isin(collaborative_recs), 'score'] += 3
    interacted_products = interaction_data[interaction_data['user_id'] == user_id]['product_id'].unique()
    recs = recs[~recs['product_id'].isin(interacted_products)]
    top_recs = recs.sort_values('score', ascending=False)['product_id'].drop_duplicates().head(num_recommendations)
    return top_recs.tolist()

# 4. Initialize Flask App

app = Flask(__name__)

@app.route('/recommend', methods=['GET', 'POST'])
def recommend():
    if request.method == 'POST':
        user_id = request.json['user_id']
    else:
        user_id = request.args.get('user_id', default=1, type=int)
    # Fetch user segment
    user_segment = user_data[user_data['user_id'] == user_id]['segment'].values[0]
    # Generate recommendations
    recommendations = hybrid_recommendation(user_id, user_segment)
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    app.run(debug=True)
