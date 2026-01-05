import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import os


_DEFAULT_TESSERACT_WINDOWS = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
_TESSERACT_CMD = os.environ.get("TESSERACT_CMD")
if _TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD
elif os.name == "nt" and os.path.exists(_DEFAULT_TESSERACT_WINDOWS):
    pytesseract.pytesseract.tesseract_cmd = _DEFAULT_TESSERACT_WINDOWS

def extract_text(processed_image):
    """
    Extract text from preprocessed image using Tesseract
    """
    
    # Handle different input types
    if isinstance(processed_image, bytes):
        # Decode bytes to numpy array
        nparr = np.frombuffer(processed_image, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image from bytes")
        
        # Convert BGR to RGB for PIL
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(img)
        
    elif isinstance(processed_image, np.ndarray):
        # OpenCV uses BGR, convert to RGB for PIL
        if len(processed_image.shape) == 3:
            # Color image
            processed_image = cv2.cvtColor(processed_image, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(processed_image)
        else:
            # Grayscale image
            pil_image = Image.fromarray(processed_image)
            
    elif isinstance(processed_image, Image.Image):
        # Already a PIL Image
        pil_image = processed_image
        
    else:
        raise TypeError(f"Unsupported image type: {type(processed_image)}")
    
    # Tesseract configuration
    custom_config = r"--oem 3 --psm 6"
    
    # Extract text
    text = pytesseract.image_to_string(
        pil_image,
        config=custom_config
    )
    
    return text