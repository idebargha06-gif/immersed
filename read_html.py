import codecs

# Read the file with flexible encoding
try:
    with codecs.open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
except:
    with codecs.open('index.html', 'r', encoding='utf-8-sig') as f:
        content = f.read()

print(content[:2000])  # Print first 2000 chars to see structure
