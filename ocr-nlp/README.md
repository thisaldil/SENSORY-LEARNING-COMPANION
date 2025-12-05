
# 🔵 **Component: NLP / OCR and Education Scene & Script Generator**

**👤 Name:** *Gonsalkorala T D — Group Leader*

This component processes educational input and generates structured learning metadata.
It handles **OCR**, **NLP**, **concept extraction**, **scene graph building**, and **narration script generation** for the Sensory Learning Companion.

---

# 🟣 **What This Service Accepts**

### **1. Textbook Image 📷**

Uploaded by the student or teacher.

### **2. Plain Text 📝**

Typed or pasted lesson text.

---

# 🟢 **What This Service Returns**

The service outputs **one structured JSON object** containing:

* **extracted_text**
* **concepts**
* **relations**
* **example_mapping**
* **scene_graph**
* **narration_script**

---

# 🟠 **API Endpoints**

## **🔹 POST /process-image**

Used for textbook scans or diagram images.

### **Request (multipart/form-data):**

* `file` → uploaded image
* `user` → user ID forwarded from Node backend
* `auth_token` → Node login token

### **Response (JSON):**

```json
{
  "extracted_text": "",
  "concepts": [],
  "relations": [],
  "example_mapping": {},
  "scene_graph": {},
  "narration_script": ""
}
```

---

## **🔹 POST /process-text**

Used when the user inputs lesson text manually.

### **Request (JSON):**

```json
{
  "text": "The text to process",
  "user": "user id",
  "auth_token": "token"
}
```

### **Response:**

Same structure as **POST /process-image**.

---

# 🔵 **Response Structure (Full)**

```json
{
  "extracted_text": "string",
  "concepts": ["string"],
  "relations": [
    { "from": "string", "to": "string", "relation": "string" }
  ],
  "example_mapping": {
    "concept": "example sentence"
  },
  "scene_graph": {
    "nodes": [
      { "id": "gravity", "type": "concept", "example": "apple falling" }
    ],
    "edges": [
      { "from": "gravity", "to": "objects", "relation": "pulls" }
    ]
  },
  "narration_script": "string"
}
```

---

# 🔐 **Authentication Flow**

* The **Node backend** validates users.
* Node forwards a secure token to the OCR/NLP service.
* The Python service **does not handle login**.
* It only verifies the token and processes the content.

---

# 🧩 **Processing Pipeline Stages**

1. **OCR Preprocessing** (image only)
2. **OCR Extraction → text**
3. **Text Cleaning**
4. **Concept Extraction**
5. **Relation Extraction**
6. **Example Mapping**
7. **Scene Graph Builder**
8. **Narration Script Generator**

---


Node backend acts as the API gateway. It forwards user content to the OCR/NLP microservice through secure internal API calls