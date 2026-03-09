import os

from google.cloud import vision

# Prefer configuring credentials via the GOOGLE_APPLICATION_CREDENTIALS environment
# variable, pointing to your Vision JSON key file, e.g.:
#   export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/vision-api-489413-3be174ca33c7.json"
# The default client constructor will pick this up automatically.


vision_client = vision.ImageAnnotatorClient()

