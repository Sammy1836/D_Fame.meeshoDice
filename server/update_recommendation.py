# update_recommendation.py

from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from datetime import datetime

# 1. Load Data

# Existing User Data (for clustering)
existing_user_data = pd.read_csv('existing_user_data.csv')

# Encode categorical variables
existing_user_data_encoded = pd.get_dummies(existing_user_data, columns=['gender', 'location'])

# Segment users
demographic_features = existing_user_data_encoded.drop(['user_id', 'name'], axis=1)
kmeans = KMeans(n_clusters=5, random_state=42)
existing_user_data_encoded['segment'] = kmeans.fit_predict(demographic_features)

# Product Data
product_data = pd.read_csv('product_data.csv')

# Process 'product_details' to assign 'age_group', 'season', and 'gender' if not already present
if 'age_group' not in product_data.columns:
    product_data['age_group'] = product_data['product_details'].apply(lambda x: 'Kids' if 'kid' in str(x).lower() else 'Adult')

if 'season' not in product_data.columns:
    def assign_season(details):
        details_lower = str(details).lower()
        if 'winter' in details_lower:
            return 'Winter'
        elif 'summer' in details_lower:
            return 'Summer'
        elif 'monsoon' in details_lower:
            return 'Monsoon'
        elif 'autumn' in details_lower:
            return 'Autumn'
        elif 'spring' in details_lower:
            return 'Spring'
        else:
            return 'All'
    product_data['season'] = product_data['product_details'].apply(assign_season)

if 'gender' not in product_data.columns:
    def assign_gender(detail):
        detail_lower = str(detail).lower()
        if 'woman' in detail_lower or 'women' in detail_lower:
            return 'Female'
        elif 'man' in detail_lower or 'men' in detail_lower:
            return 'Male'
        else:
            return 'Unisex'
    product_data['gender'] = product_data['product_details'].apply(assign_gender)

# Create combined features (include 'gender')
product_data['combined_features'] = (
    product_data['product_details'].fillna('') + ' ' +
    product_data['season'].fillna('') + ' ' +
    product_data['gender'].fillna('')
)

# Build TF-IDF matrix
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(product_data['combined_features'])

# Interaction Data
interaction_data = pd.read_csv('interaction_data.csv')

# Merge interaction data with user segments
interaction_data = interaction_data.merge(existing_user_data_encoded[['user_id', 'segment']], on='user_id', how='left')

# Popular Products per Segment
popular_products = interaction_data.groupby(['segment', 'product_id']).size().reset_index(name='counts')
top_products_per_segment = popular_products.sort_values(['segment', 'counts'], ascending=False).groupby('segment').head(10)

# Season mapping based on location and month
def get_season(location, month):
    # Simplified season mapping
    season_map = {
        'Delhi': {
            12: 'Winter', 1: 'Winter', 2: 'Winter',
            3: 'Spring', 4: 'Spring',
            5: 'Summer', 6: 'Summer', 7: 'Monsoon',
            8: 'Monsoon', 9: 'Autumn', 10: 'Autumn', 11: 'Autumn'
        },
        'Mumbai': {
            12: 'Winter', 1: 'Winter', 2: 'Winter',
            3: 'Summer', 4: 'Summer', 5: 'Summer',
            6: 'Monsoon', 7: 'Monsoon', 8: 'Monsoon', 9: 'Monsoon',
            10: 'Autumn', 11: 'Autumn'
        },
        'Chennai': {
            12: 'Winter', 1: 'Winter', 2: 'Winter',
            3: 'Summer', 4: 'Summer', 5: 'Summer',
            6: 'Summer', 7: 'Monsoon', 8: 'Monsoon', 9: 'Monsoon',
            10: 'Autumn', 11: 'Autumn'
        },
        # Add other locations as needed
    }
    # Default to 'All' if location not found
    return season_map.get(location, {}).get(month, 'All')

# 2. Define Functions

def recommend_updated(user_info, user_segment, num_recommendations=5):
    # Get current month
    current_month = datetime.now().month
    user_location = user_info['location']
    user_age = user_info['age']
    user_gender = user_info['gender']
    user_age_group = 'Kids' if user_age <= 12 else 'Adult'
    user_season = get_season(user_location, current_month)

    # Get user's interaction data
    user_interaction_data = interaction_data[interaction_data['user_id'] == user_info['user_id']]

    # Filter products based on season, age_group, and gender
    eligible_products = product_data[
        (
            ((product_data['season'] == user_season) | (product_data['season'] == 'All')) &
            ((product_data['age_group'] == user_age_group) | (product_data['age_group'] == 'All')) &
            ((product_data['gender'] == user_gender) | (product_data['gender'] == 'Unisex'))
        )
    ]

    # If user has interactions, use content-based filtering
    if not user_interaction_data.empty:
        # Build user profile
        interacted_products = user_interaction_data['product_id'].unique()
        product_indices = product_data[product_data['product_id'].isin(interacted_products)].index

        # Recalculate the TF-IDF matrix for eligible products
        eligible_indices = eligible_products.index
        eligible_tfidf_matrix = tfidf_matrix[eligible_indices]

        # Build the user profile vector using only the eligible products
        user_tfidf_matrix = tfidf_matrix[product_indices]
        user_profile_vector = user_tfidf_matrix.mean(axis=0)

        # Calculate similarities between user profile and eligible products
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(user_profile_vector, eligible_tfidf_matrix).flatten()

        # Create a DataFrame with product IDs and similarity scores
        similarity_df = pd.DataFrame({
            'product_id': eligible_products['product_id'],
            'similarity': similarities
        })

        # Exclude already interacted products
        similarity_df = similarity_df[~similarity_df['product_id'].isin(interacted_products)]

        # Sort by similarity
        similarity_df = similarity_df.sort_values('similarity', ascending=False)

        # Get content-based recommendations
        content_recs = similarity_df['product_id'].tolist()

        # Get demographic recommendations
        demographic_recs = recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations*2)

        # Combine and rank recommendations
        recs = pd.DataFrame({'product_id': demographic_recs + content_recs})
        recs['score'] = 0
        recs.loc[recs['product_id'].isin(demographic_recs), 'score'] += 1  # Demographic weight
        recs.loc[recs['product_id'].isin(content_recs), 'score'] += 2      # Interaction weight

        # Remove duplicates and sort
        final_recommendations = recs.drop_duplicates().sort_values('score', ascending=False)['product_id'].tolist()

        # Limit to desired number of recommendations
        final_recommendations = final_recommendations[:num_recommendations]
    else:
        # If no interactions, fall back to initial recommendations
        final_recommendations = recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations)

    return final_recommendations

def recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations=5):
    # Get current month
    current_month = datetime.now().month
    user_location = user_info['location']
    user_age = user_info['age']
    user_gender = user_info['gender']
    user_age_group = 'Kids' if user_age <= 12 else 'Adult'
    user_season = get_season(user_location, current_month)

    # Filter products based on season, age_group, and gender
    eligible_products = product_data[
        (
            ((product_data['season'] == user_season) | (product_data['season'] == 'All')) &
            ((product_data['age_group'] == user_age_group) | (product_data['age_group'] == 'All')) &
            ((product_data['gender'] == user_gender) | (product_data['gender'] == 'Unisex'))
        )
    ]

    # Get popular products in the user's segment
    segment_products = top_products_per_segment[top_products_per_segment['segment'] == user_segment]
    segment_product_ids = segment_products['product_id']

    # Filter eligible products that are popular in the user's segment
    recommended_products = eligible_products[eligible_products['product_id'].isin(segment_product_ids)]

    # If not enough products, fill with other eligible products
    if len(recommended_products) < num_recommendations:
        additional_products = eligible_products[~eligible_products['product_id'].isin(recommended_products['product_id'])]
        recommended_products = pd.concat([recommended_products, additional_products])

    # Get the top N recommendations
    recommendations = recommended_products['product_id'].head(num_recommendations).tolist()
    return recommendations

# 3. Initialize Flask App

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('input_form1.html')

@app.route('/updated_recommend', methods=['POST'])
def updated_recommend():
    # Get user data from form
    user_info = {
        'user_id': int(request.form['user_id']),
        'name': request.form['name'],
        'age': int(request.form['age']),
        'gender': request.form['gender'],
        'location': request.form['location']
    }

    # Create DataFrame for the user
    user_data = pd.DataFrame({
        'user_id': [user_info['user_id']],
        'name': [user_info['name']],
        'age': [user_info['age']],
        'gender': [user_info['gender']],
        'location': [user_info['location']]
    })
    user_data_encoded = pd.get_dummies(user_data, columns=['gender', 'location'])

    # Ensure all columns match existing users
    for col in demographic_features.columns:
        if col not in user_data_encoded.columns:
            user_data_encoded[col] = 0

    # Remove any extra columns not in demographic_features
    extra_cols = [col for col in user_data_encoded.columns if col not in demographic_features.columns and col not in ['user_id', 'name']]
    user_data_encoded.drop(columns=extra_cols, inplace=True)

    # Ensure the order of columns matches
    user_features = user_data_encoded[demographic_features.columns]

    # Predict the user's segment
    user_segment = kmeans.predict(user_features)[0]

    # Generate recommendations
    recommendations = recommend_updated(user_info, user_segment)

    # Fetch product details for display
    recommended_products = product_data[product_data['product_id'].isin(recommendations)]

    return render_template('recommendations1.html', products=recommended_products.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
