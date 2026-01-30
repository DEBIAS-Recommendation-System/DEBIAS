# DEBIAS
### Debiased E-commerce with Budget-Integrated Affordability Search


##  Overview

**DEBIAS** is a context-aware FinCommerce engine that integrates multimodal product discovery with user-specific financial constraints. The system delivers real-time, constraint-aware search and personalized recommendations at scale.



## Problem Statement

**Relevance Saturation Bias** occurs when:
- Users stop interacting after finding any acceptable product
- Lower-priced or better-value items receive less engagement
- Ranking models learn position bias instead of true relevance



##  How DEBIAS Works (High-Level)

DEBIAS combines:
- Semantic intent understanding
- Budget-aware retrieval
- Debiasing-aware re-ranking
- Cold-start reasoning via product graphs

Affordability is integrated before ranking—not applied afterward—ensuring fair exposure for items.

---

## Key Features

- **Budget-Integrated Affordability Search**  
  Interprets budgets dynamically using category-relative pricing (e.g., percentiles instead of fixed price caps).

- **Debiased Ranking (DualIPW)**  
  Corrects exposure bias so affordable products aren’t penalized by early user exits.

- **Cold-Start Intelligence**  
  Uses graph-based Hub Products to connect new users and items with no interaction history.

---

## Tech Stack

| Layer | Technology | Purpose |
|------|-----------|--------|
| Frontend | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) | Server-side rendered UI for product discovery |
| Backend | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) | Async API for financial encoding & reranking |
| Message Queue | ![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white) | Asynchronous event processing & orchestration |
| Vector Search | ![Qdrant](https://img.shields.io/badge/Qdrant-FF4F00?style=for-the-badge&logo=qdrant&logoColor=white) | Hybrid vector + payload search |
| Graph Database | ![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white) | Cold-start & hub-product traversal |
| Relational DB | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) | User profiles & product metadata |

---

## Setup & Run Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js v18+
- Python v3.9+

---

### Clone the Repository
```bash
git clone https://github.com/your-org/debias.git
cd debias

docker-compose up -d

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

cd frontend
npm install
npm run dev
```
## Team

- Youssef Abid  
- Ala Eddine Zaouali  
- Adem Saidi  
- Noursine Amira  
- Younes Abbes 