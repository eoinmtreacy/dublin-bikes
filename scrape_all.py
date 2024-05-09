import scrape_city as scrape_city

cities = [
    "maribor", "vilnius", "bruxelles", "creteil",
    "mulhouse", "luxembourg", "lund", "namur",
    "valence", "nancy", "ljubljana", "nantes",
    "cergypontoise", "dublin", "toulouse", "lillestrom",
    "seville", "toyama", "lyon", "besancon",
    "amiens"
]

for city in cities:
    scrape_city.main(city)
