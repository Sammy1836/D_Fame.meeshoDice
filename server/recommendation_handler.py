import sys
import json
import pandas as pd
from sklearn.cluster import KMeans
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load data
product_data = pd.read_csv('product_data.csv')
product_url_data = pd.read_csv('product_url.csv')
product_data = pd.merge(product_data, product_url_data, on='product_id', how='left')
existing_user_data = pd.read_csv('existing_user_data.csv')
interaction_data = pd.read_csv('interaction_data.csv')

# Encode categorical variables
existing_user_data_encoded = pd.get_dummies(existing_user_data, columns=['gender', 'location'])

# Segment users
demographic_features = existing_user_data_encoded.drop(['user_id', 'name'], axis=1)
kmeans = KMeans(n_clusters=5, random_state=42)
existing_user_data_encoded['segment'] = kmeans.fit_predict(demographic_features)

# Process product data
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

# Create combined features
product_data['combined_features'] = (
    product_data['product_details'].fillna('') + ' ' +
    product_data['season'].fillna('') + ' ' +
    product_data['gender'].fillna('')
)

# Build TF-IDF matrix
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(product_data['combined_features'])

# Merge interaction data with user segments
interaction_data = interaction_data.merge(existing_user_data_encoded[['user_id', 'segment']], on='user_id', how='left')

# Popular Products per Segment
popular_products = interaction_data.groupby(['segment', 'product_id']).size().reset_index(name='counts')
top_products_per_segment = popular_products.sort_values(['segment', 'counts'], ascending=False).groupby('segment').head(10)

def get_season(location, month):
    season_map = {
        'Delhi': {12: 'Winter', 1: 'Winter', 2: 'Winter', 3: 'Spring', 4: 'Spring', 5: 'Summer', 6: 'Summer', 7: 'Monsoon', 8: 'Monsoon', 9: 'Autumn', 10: 'Autumn', 11: 'Autumn'},
        'Mumbai': {12: 'Winter', 1: 'Winter', 2: 'Winter', 3: 'Summer', 4: 'Summer', 5: 'Summer', 6: 'Monsoon', 7: 'Monsoon', 8: 'Monsoon', 9: 'Monsoon', 10: 'Autumn', 11: 'Autumn'},
        'Chennai': {12: 'Winter', 1: 'Winter', 2: 'Winter', 3: 'Summer', 4: 'Summer', 5: 'Summer', 6: 'Summer', 7: 'Monsoon', 8: 'Monsoon', 9: 'Monsoon', 10: 'Autumn', 11: 'Autumn'},
    }
    return season_map.get(location, {}).get(month, 'All')

def recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations=5):
    current_month = datetime.now().month
    user_location = user_info['location']
    user_age = user_info['age']
    user_gender = user_info['gender']
    user_age_group = 'Kids' if user_age <= 12 else 'Adult'
    user_season = get_season(user_location, current_month)

    eligible_products = product_data[
        (
            ((product_data['season'] == user_season) | (product_data['season'] == 'All')) &
            ((product_data['age_group'] == user_age_group) | (product_data['age_group'] == 'All')) &
            ((product_data['gender'] == user_gender) | (product_data['gender'] == 'Unisex'))
        )
    ]

    segment_products = top_products_per_segment[top_products_per_segment['segment'] == user_segment]
    segment_product_ids = segment_products['product_id']

    recommended_products = eligible_products[eligible_products['product_id'].isin(segment_product_ids)]

    if len(recommended_products) < num_recommendations:
        additional_products = eligible_products[~eligible_products['product_id'].isin(recommended_products['product_id'])]
        recommended_products = pd.concat([recommended_products, additional_products])

    recommendations = recommended_products.head(num_recommendations).to_dict(orient='records')
    
    for rec in recommendations:
        rec['product_image_url'] = rec.get('product_image_url', 'https://via.placeholder.com/300x300?text=No+Image')
        rec['product_url'] = rec.get('product_url', '#')
    
    return recommendations

def recommend_updated(user_info, user_segment, num_recommendations=5):
    current_month = datetime.now().month
    user_location = user_info['location']
    user_age = user_info['age']
    user_gender = user_info['gender']
    user_age_group = 'Kids' if user_age <= 12 else 'Adult'
    user_season = get_season(user_location, current_month)

    user_interaction_data = interaction_data[interaction_data['user_id'] == user_info['user_id']]

    eligible_products = product_data[
        (
            ((product_data['season'] == user_season) | (product_data['season'] == 'All')) &
            ((product_data['age_group'] == user_age_group) | (product_data['age_group'] == 'All')) &
            ((product_data['gender'] == user_gender) | (product_data['gender'] == 'Unisex'))
        )
    ]

    if not user_interaction_data.empty:
        interacted_products = user_interaction_data['product_id'].unique()
        product_indices = product_data[product_data['product_id'].isin(interacted_products)].index

        eligible_indices = eligible_products.index
        eligible_tfidf_matrix = tfidf_matrix[eligible_indices]

        user_tfidf_matrix = tfidf_matrix[product_indices]
        user_profile_vector = user_tfidf_matrix.mean(axis=0)

        similarities = cosine_similarity(user_profile_vector, eligible_tfidf_matrix).flatten()

        similarity_df = pd.DataFrame({
            'product_id': eligible_products['product_id'],
            'similarity': similarities
        })

        similarity_df = similarity_df[~similarity_df['product_id'].isin(interacted_products)]
        similarity_df = similarity_df.sort_values('similarity', ascending=False)

        content_recs = similarity_df['product_id'].tolist()

        demographic_recs = recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations*2)

        recs = pd.DataFrame({'product_id': demographic_recs + content_recs})
        recs['score'] = 0
        recs.loc[recs['product_id'].isin(demographic_recs), 'score'] += 1
        recs.loc[recs['product_id'].isin(content_recs), 'score'] += 2

        final_recommendations = recs.drop_duplicates().sort_values('score', ascending=False)['product_id'].tolist()
        final_recommendations = final_recommendations[:num_recommendations]
    else:
        final_recommendations = recommend_initial(user_info, user_segment, top_products_per_segment, num_recommendations)

    recommended_products = product_data[product_data['product_id'].isin(final_recommendations)].to_dict(orient='records')
    
    for rec in recommended_products:
        rec['product_image_url'] = rec.get('product_image_url', 'https://via.placeholder.com/300x300?text=No+Image')
        rec['product_url'] = rec.get('product_url', '#')
    
    return recommended_products

def get_recommendations(email, name, age, gender, city, login_count):
    user_info = {
        'user_id': email,
        'name': name,
        'age': int(age),
        'gender': gender,
        'location': city
    }

    new_user_data = pd.DataFrame([user_info])
    new_user_data_encoded = pd.get_dummies(new_user_data, columns=['gender', 'location'])

    for col in demographic_features.columns:
        if col not in new_user_data_encoded.columns:
            new_user_data_encoded[col] = 0

    extra_cols = [col for col in new_user_data_encoded.columns if col not in demographic_features.columns and col not in ['user_id', 'name']]
    new_user_data_encoded.drop(columns=extra_cols, inplace=True)

    new_user_features = new_user_data_encoded[demographic_features.columns]
    user_segment = kmeans.predict(new_user_features)[0]

    if int(login_count) == 0:
        recommendations = recommend_initial(user_info, user_segment, top_products_per_segment)
    else:
        recommendations = recommend_updated(user_info, user_segment)

    return recommendations

if __name__ == '__main__':
    email, name, age, gender, city, login_count = sys.argv[1:]
    recommendations = get_recommendations(email, name, age, gender, city, login_count)
    print(json.dumps(recommendations))