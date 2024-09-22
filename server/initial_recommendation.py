import sys
import json
import pandas as pd
import numpy as np

# Load Product Data
product_data = pd.read_csv('meesho_all_products_data.csv')

def calculate_score(row):
    try:
        rating = float(row['Rating']) if row['Rating'] != 'N/A' else 0
        reviews = int(row['Reviews']) if row['Reviews'] != 'N/A' else 0
        return rating * np.log1p(reviews)
    except:
        return 0

def is_product_for_gender(title, query, gender):
    title_lower = title.lower()
    query_lower = query.lower()
    if gender == 'male':
        return ('men' in title_lower or 'men' in query_lower) and not ('women' in title_lower or 'women' in query_lower)
    elif gender == 'female':
        return ('women' in title_lower or 'women' in query_lower) and not ('men' in title_lower or 'men' in query_lower)
    return True  # If gender is unspecified, consider all products

def recommend_initial(user_info, page=0, items_per_page=20):
    user_gender = user_info['gender'].lower()

    # Apply gender filter and calculate scores
    eligible_products = product_data[product_data.apply(lambda row: is_product_for_gender(row['Title'], row['Query'], user_gender), axis=1)].copy()
    
    # If no products match the gender, return all products (fallback)
    if eligible_products.empty:
        eligible_products = product_data.copy()
    
    # Calculate score based on rating and reviews
    eligible_products['score'] = eligible_products.apply(calculate_score, axis=1)

    # Sort products by score and select recommendations for the current page
    ranked_products = eligible_products.sort_values('score', ascending=False)
    start = page * items_per_page
    end = start + items_per_page
    recommendations = ranked_products.iloc[start:end]

    # Prepare the output
    output = recommendations[['Title', 'Price', 'Rating', 'Reviews', 'Image URL', 'Product URL']].to_dict('records')

    return output

if __name__ == '__main__':
    email, name, age, gender, city, page = sys.argv[1:]
    
    # Handle potential invalid inputs
    try:
        age = int(age)
    except ValueError:
        age = 0  # Default age if invalid

    gender = gender.lower() if gender.lower() in ['male', 'female'] else 'female'
    
    page = int(page) if page.isdigit() else 0

    user_info = {
        'user_id': email,
        'name': name,
        'age': age,
        'gender': gender,
        'location': city
    }

    recommendations = recommend_initial(user_info, page)
    print(json.dumps(recommendations))