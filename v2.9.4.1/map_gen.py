import urllib.request
import json

url = "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())
    
print("Sample properties:")
print(data['features'][0]['properties'])
