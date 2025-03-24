import requests
import json
import random
from datetime import datetime

# Webhook URL
webhook_url = "https://eoeyekcgqu06mpf.m.pipedream.net"


# Generate random payload
def generate_random_payload():
    return {
        "id": random.randint(1, 1000),
        "timestamp": datetime.now().isoformat(),
        "data": {
            "value": random.uniform(0, 100),
            "message": f"Random message {random.randint(1, 10000)}",
            "active": random.choice([True, False]),
        },
        "metadata": {"source": "webhook-testing-script", "version": "1.0.0"},
    }


# Create the payload
payload = generate_random_payload()
print(f"Sending payload: {json.dumps(payload, indent=2)}")

# Send the request
response = requests.post(webhook_url, json=payload)

# Print response
print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")
