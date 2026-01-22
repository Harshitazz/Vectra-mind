# AI-Powered Multilingual Document Query System

[Live Demo](https://news-ai-frontend-rosy.vercel.app/)

## Overview
This web application enables users to upload documents (PDFs) or provide URLs, and then ask questions about their content in multiple languages. The system uses advanced AI models and vector search to deliver accurate, context-aware answers quickly and securely.

## How the System Works
1. **Document/URL Upload**: Users can upload PDF files or submit URLs through the frontend interface.
2. **Text Extraction & Embedding**: The backend extracts text from the uploaded documents or URLs. It then uses Hugging Face Sentence Transformers to convert the text into vector embeddings, capturing semantic meaning.
3. **Vector Storage (FAISS)**: These embeddings are stored in a FAISS vector database, enabling efficient similarity search.
4. **Semantic Search & LLM Querying**: When a user asks a question, the system searches for the most relevant document sections using FAISS. The retrieved context is then passed to a Large Language Model (LLM) via LangChain to generate a precise answer.
5. **Multilingual Support**: The system supports queries and documents in multiple languages, leveraging multilingual models for both embedding and LLM responses.
6. **Optimized & Secure**: API calls are optimized for low latency, and rate limiting is enforced for security. The backend is deployed on AWS for scalability and reliability.

## Technical Details
- **Frontend**: Built with Next.js and Tailwind CSS for a modern, responsive UI. Users can upload files, enter URLs, and interact with the chatbot interface for Q&A.
- **Backend**: FastAPI handles API requests, document processing, embedding generation, and LLM interactions.
- **Vector Database**: FAISS is used for fast, scalable vector similarity search.
- **Machine Learning**: Hugging Face Sentence Transformers for embeddings; LangChain orchestrates LLM calls for answer generation.
- **Deployment**: The backend is deployed on AWS, and the frontend is hosted on Vercel ([Live Demo](https://news-ai-frontend-rosy.vercel.app/)).

## Key Functionalities
- **Document-based Q&A**: Ask questions about the content of uploaded PDFs or web pages.
- **Multilingual Semantic Search**: Supports queries and documents in various languages.
- **Efficient Vector Search**: Uses FAISS for rapid retrieval of relevant content.
- **Secure & Scalable**: Rate limiting and cloud deployment ensure reliability and safety.

---

# Backend: Document Query System
[Deployed API](https://news-ai-394571818909.us-central1.run.app)
A FastAPI-based backend for querying documents using RAG (Retrieval-Augmented Generation) with Groq LLM and FAISS vector storage.

## Features

- 📄 PDF document upload and processing (with OCR for scanned documents)
- 🔍 Semantic search using FAISS vector store
- 💬 Question-answering based on uploaded documents
- 🔐 Clerk authentication integration
- ☁️ Multi-backend storage support (S3, R2, Local)
- ⚡ In-memory caching for performance (with optional Redis support)
- 🏃‍♂️ Background task processing and status polling

## Technical Details

### OCR (Optical Character Recognition)
- The backend automatically detects and extracts text from scanned PDFs using OCR libraries (e.g., Tesseract via pytesseract) when native text is not available.
- This ensures all documents, including images and scans, are searchable and answerable.

### Background Tasks & Polling
- Long-running operations (such as PDF processing, embedding generation, or large uploads) are handled as background tasks using FastAPI's background task utilities or Celery for distributed workloads.
- The API provides endpoints to check the status of these tasks (`GET /task_status/{task_id}`), enabling the frontend to poll and update users on progress.

### S3-Compatible Storage
- The system supports AWS S3, Cloudflare R2, and other S3-compatible storage providers for scalable, reliable file storage.
- Storage abstraction allows easy migration between providers. Files are uploaded, retrieved, and deleted via unified interfaces.

### Deployment on GCP
- The backend can be deployed on Google Cloud Platform (GCP) using Cloud Run, GKE, or Compute Engine.
- Environment variables and storage credentials can be configured for GCP buckets or other cloud resources.
- Dockerfile is provided for containerized deployment, ensuring portability across cloud providers.

### Dockerfile
- The included `Dockerfile` allows for easy containerization and deployment of the backend.
- Supports multi-stage builds for smaller images and faster startup.
- Compatible with most cloud container services (GCP, AWS, Railway, Fly.io, etc.).

### Authentication
- Clerk authentication is integrated for secure user access and API protection.
- All endpoints requiring user context validate Clerk tokens and permissions.

### Caching with Redis
- In-memory caching is used for fast access to frequently requested data.
- Optional Redis integration allows for distributed caching, improving performance and scalability in production environments.

## API Endpoints

- `POST /upload_pdfs/` - Upload PDF documents
- `POST /ask_pdf` - Ask questions about uploaded PDFs
- `POST /initialize_faiss` - Initialize FAISS index from URLs
- `POST /ask` - Ask questions about URL-based documents
- `GET /task_status/{task_id}` - Check processing status

## Storage Backends

The system supports multiple storage backends:

- **AWS S3** - Traditional cloud storage
- **Cloudflare R2** - S3-compatible, cheaper (recommended)
- **Local** - Filesystem storage for development/small deployments

Set `STORAGE_BACKEND` environment variable to switch backends.

## Environment Variables

See `.env.example` for all available configuration options.

Required:
- `STORAGE_BACKEND` - Storage backend (s3, r2, or local)
- `GROQ_API_KEY` - Groq API key for LLM
- `CLERK_SECRET_KEY` - Clerk authentication key

Storage-specific (depending on backend):
- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- Local: `LOCAL_STORAGE_PATH`, `LOCAL_STORAGE_URL`

## Project Structure

```
news-ai/
├── main.py              # FastAPI application
├── auth.py              # Clerk authentication
├── storage.py           # Storage abstraction layer
├── cache.py             # Caching utilities
├── cleanUp.py           # File cleanup tasks
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container configuration
```

## Cost Optimization

This project includes several optimizations:

1. **Storage abstraction** - Easy migration to cheaper providers
2. **In-memory caching** - Reduces API calls and storage downloads
3. **Efficient embeddings** - Uses lightweight models
4. **Auto-cleanup** - Removes old files automatically

---

## Frontend: Multilingual & Speech Features

### MyMemory Translation API
- The frontend integrates with the MyMemory Translation API to provide real-time translation of user queries and responses, enabling seamless multilingual support.
- When a user submits a question in a language different from the document, the frontend can translate the query and/or the answer as needed.

### Text-to-Speech (Speaking)
- The frontend uses the Web Speech API (or similar browser-based TTS solutions) to read out answers to users.
- This feature enhances accessibility and user experience, especially for users who prefer listening to answers or have visual impairments.

---

Enjoy using the AI-Powered Multilingual Document Query System! 🚀

