# BOQMind AI

AI-powered Quantity Surveying platform - upload construction drawings, generate BOQ, estimate costs, and explore interactive 3D building models.

## Features

- **Drawing Upload** - Upload PDF, image, DWG, or DXF files
- **Smart BOQ Generator** - Export BOQ data as PDF or Excel when extracted data is available
- **3D Visualization** - Parse uploaded DWG layout entities into an interactive browser preview
- **Cost Estimation** - Material rates, quantity calculations, and AI cost prediction
- **Revision Compare** - Version 1 vs Version 2 change detection
- **Contractor Analyzer** - Multi-quote comparison with recommendation
- **Sustainability Calculator** - Carbon, wastage, water, and eco alternatives
- **Site Progress** - Photo upload with mock AI verification
- **Voice QS Assistant** - Chat and voice input with mock/OpenAI backend

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, CSS, React Three Fiber, Drei, Recharts |
| Backend | Java 17, Spring Boot 3.2, MongoDB |
| 3D | Three.js and LibreDWG Web |

## Project Structure

```text
frontend/         # React + Vite app
  src/
    components/   # Reusable UI
    pages/        # App pages
    data/         # Sample data
    utils/        # API client, exports, calculations, DWG parser
backend/          # Spring Boot REST API
```

## Quick Start

### Prerequisites

- Node.js 18+
- Java 17+
- Maven 3.8+
- MongoDB (optional - the app can fall back when MongoDB is unavailable)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Backend

```bash
cd backend
mvn spring-boot:run
```

API runs at http://localhost:8080

### Enable OpenAI (optional)

```bash
export OPENAI_API_KEY=sk-your-key
```

In `backend/src/main/resources/application.properties`:

```properties
openai.enabled=true
```

## API Endpoints

- `GET /api/projects/summary` - Dashboard summary
- `GET /api/boq` - BOQ items
- `POST /api/upload/drawing` - Upload drawing
- `POST /api/ai/assistant` - QS assistant Q&A
- `GET /api/ai/status` - AI engine status

## License

MIT - Built for academic / hackathon demonstration.
