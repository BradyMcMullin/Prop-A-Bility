# 🌱 Prop-A-Bility

**Prop-A-Bility** is an AI-powered botanical application designed to help new plant enthusiasts successfully propagate their plants. Built as a Senior Capstone Project, the primary focus and core engineering of this project lie in the creation of a custom machine learning pipeline—built from the ground up through rigorous physical data collection—to predict the rooting viability of plant cuttings and visually educate users on proper propagation techniques.

## 📖 About the Project

While many applications can identify a plant, very few can tell a user if their specific cutting is actually going to survive. Propagation is a delicate process, and identifying the correct part of the plant to cut (the node) is the biggest hurdle for beginners.

The majority of this project's development was dedicated to curating a proprietary dataset and training specialized machine learning models. Over 100 physical plant propagates were hand-gathered and monitored. By tracking their viability and extracting frames from video tracking, a robust success/failure classification database was established. This custom data powers a transfer-learning classification model to predict root growth, alongside a custom-trained object detection model that visually highlights plant nodes to educate users.

The web application serves as the user-facing delivery mechanism for these models, enriched with third-party APIs for extended botanical care data.

## 🧠 Core Machine Learning Architecture

The true engine of Prop-A-Bility is its custom AI pipeline:

* **Proprietary Dataset Creation:** Hand-gathered over 100 physical plant propagates. A 20-second video was recorded for each cutting. By actively tracking the long-term viability of each cutting, frames were extracted from these videos to build a comprehensive, perfectly-labeled success/failure classification database.
* **Viability Classification (MobileNetV3):** Utilized Google's MobileNetV3 via transfer learning, fine-tuned on the custom frame-extraction dataset. This model analyzes the user's cutting and predicts the statistical probability of it successfully growing roots.
* **Node Detection & User Education (YOLO):** To address the #1 cause of propagation failure (missing the node), a custom YOLO (You Only Look Once) object detection model was trained. Over 1,000 plant images were manually annotated with bounding boxes around the botanical nodes. This model not only improves overall identification accuracy but visually highlights the nodes for the user, teaching them exactly where roots will emerge.

## ✨ Web Platform Features

* **Propagation Dashboard:** A responsive web interface where users can upload photos of their cuttings and view their AI-predicted success probabilities.
* **Interactive Node Highlighting:** Displays the YOLO-generated bounding boxes over user uploads to educate them on node placement.
* **Species Identification (Pl@ntNet):** Integrated Pl@ntNet AI to automatically classify the species of the uploaded cutting.
* **Botanical Data Enrichment (Trefle):** Automatically fetches sunlight requirements, edibility, and toxicity warnings for pets/humans to ensure safe propagation environments.
* **Live Species Correction:** A debounced, live-search dropdown allowing users to manually correct the AI's identification by searching the Trefle botanical database.
* **Secure Architecture:** Built on Supabase with Row Level Security (RLS) and custom Edge Functions to safely proxy third-party API keys and handle user authentication (Google OAuth / Email).

## 🛠️ Tech Stack

**Machine Learning & Data Science:**

* Python
* TensorFlow / Keras (MobileNetV3)
* Ultralytics YOLOv8
* FFmpeg (Video frame extraction and processing)
* RoboFlow / Custom Annotation Tools

**Frontend & Backend:**

* React.js (Vite) & TypeScript
* Tailwind CSS
* Supabase (PostgreSQL, Auth, Storage)
* Deno (Supabase Edge Functions)

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* Python 3.9+ (for ML model inference/retraining)
* Supabase CLI

### Web App Installation

1. Clone the repository:

    ```bash
    git clone <your-repo-url>
    cd prop-a-bility
    ```

2. Install frontend dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables in a `.env` file:

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_TREFLE_API_TOKEN=your_TREFLE_api_key
    ```

4. Deploy the Supabase Edge Function (requires bypass flag for ES256 tokens):

    ```bash
    npx supabase secrets set PLANTNET_API_KEY=your_plantnet_key
    npx supabase functions deploy identify-plant --no-verify-jwt
    ```

5. Start the development server:

    ```bash
    npm run dev
    ```

## 📚 Citations & Acknowledgements

This capstone project was made possible by the following models, services, and datasets:

**Machine Learning & Data:**

1. **MobileNetV3**: Howard, A., et al. (2019). *Searching for MobileNetV3*. Used as the base architecture for the viability classification model, utilizing weights pre-trained on the **ImageNet** dataset.
2. **YOLOv8**: Jocher, G., et al. (2023). *Ultralytics YOLO*. Used for the custom node-detection model, utilizing base weights pre-trained on the **COCO** dataset.
3. **TensorFlow & FFmpeg**: Core tools utilized for model training, transfer learning, and robust video-to-frame extraction to build the proprietary propagation dataset.

**APIs & Backend:**
4. **Pl@ntNet API**: Botanical image identification. Affouard, A., et al. (2017). *Pl@ntNet app in the era of deep learning*. [Pl@ntNet Documentation](https://my.plantnet.org/).
5. **Trefle API**: Open-source botanical database and REST API utilized for fetching detailed plant characteristics and taxonomy. Data provided by Trefle and its community contributors. [Trefle Documentation](https://trefle.io).
6. **Supabase**: Backend-as-a-Service architecture, handling PostgreSQL, Auth, and Edge Functions.

---
*Developed as a Senior Capstone Project. Brady McMullin - 2026*
