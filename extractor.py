from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
import time
import csv
import re
import urllib.parse

def setup_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    return webdriver.Chrome(options=options)

def scroll_to_load_products(driver, target_count, max_scrolls=50):
    products_loaded = 0
    scroll_count = 0
    last_height = driver.execute_script("return document.body.scrollHeight")

    while products_loaded < target_count and scroll_count < max_scrolls:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)  # Wait for new products to load
        
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            print("Reached the end of the page or no new products loaded.")
            break
        last_height = new_height

        products = driver.find_elements(By.CSS_SELECTOR, "[class*='ProductList__GridCol']")
        products_loaded = len(products)
        print(f"Scroll {scroll_count + 1}: Products loaded: {products_loaded}")
        scroll_count += 1

    return products_loaded

def extract_product_info(product, query):
    try:
        title = product.find_element(By.CSS_SELECTOR, "[class*='ProductTitle']").text.strip()
    except NoSuchElementException:
        title = "N/A"

    try:
        price = product.find_element(By.CSS_SELECTOR, "[class*='PriceRow'] h5").text.strip()
        price = re.sub(r'[^\d.]', '', price)  # Remove non-numeric characters
    except NoSuchElementException:
        price = "N/A"

    try:
        rating = product.find_element(By.CSS_SELECTOR, "[class*='Rating'] span").text.strip()
    except NoSuchElementException:
        rating = "N/A"

    try:
        reviews = product.find_element(By.CSS_SELECTOR, "[class*='RatingCount']").text.strip()
        reviews = re.sub(r'[^\d]', '', reviews)  # Extract only the number
    except NoSuchElementException:
        reviews = "N/A"

    try:
        image_url = product.find_element(By.TAG_NAME, "img").get_attribute("src")
    except NoSuchElementException:
        image_url = "N/A"

    try:
        product_url = product.find_element(By.TAG_NAME, "a").get_attribute("href")
    except NoSuchElementException:
        product_url = "N/A"

    return {
        "Query": query,
        "Title": title,
        "Price": price,
        "Rating": rating,
        "Reviews": reviews,
        "Image URL": image_url,
        "Product URL": product_url
    }

def scrape_meesho_products(search_term, num_products=100, timeout=300):
    driver = setup_driver()
    products_data = []
    start_time = time.time()

    try:
        encoded_search_term = urllib.parse.quote(search_term)
        url = f"https://www.meesho.com/search?q={encoded_search_term}"
        driver.get(url)
        print(f"Page loaded for '{search_term}'. Starting to scroll...")

        products_loaded = scroll_to_load_products(driver, num_products)
        
        if products_loaded == 0:
            print("No products found. The page structure might have changed.")
            return products_data

        print(f"Found {products_loaded} products. Extracting data...")

        products = driver.find_elements(By.CSS_SELECTOR, "[class*='ProductList__GridCol']")[:num_products]

        for i, product in enumerate(products, 1):
            if time.time() - start_time > timeout:
                print(f"Timeout reached. Extracted {i-1} products.")
                break
            product_info = extract_product_info(product, search_term)
            products_data.append(product_info)
            print(f"Extracted product {i}/{len(products)}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        driver.quit()

    return products_data

def save_to_csv(data, filename):
    if not data:
        print("No data to save.")
        return
    
    keys = ["Query", "Title", "Price", "Rating", "Reviews", "Image URL", "Product URL"]
    with open(filename, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)

# Main execution
# search_terms = ["men jeans", "women jeans", "kurta", "kurti", "women shirts", "men shirts", "men shoes", "women shoes", "men sweater", "women sweater", "men shorts", "women shorts", "jewellery", "belt"]
search_terms = ["jewellery", "black kurti"]
all_products_data = []

for search_term in search_terms:
    print(f"\nScraping products for: {search_term}")
    products_data = scrape_meesho_products(search_term, num_products=40)  # Adjust num_products as needed

    if products_data:
        all_products_data.extend(products_data)
        print(f"Scraped {len(products_data)} products for {search_term}")
    else:
        print(f"No data was scraped for {search_term}. Please check the website structure or your internet connection.")

if all_products_data:
    filename = "meesho_jewellery&black_kurti_data.csv"
    save_to_csv(all_products_data, filename)
    print(f"\nAll data saved to {filename}")
else:
    print("\nNo data was scraped for any search term.")

print("\nScraping complete for all search terms.")