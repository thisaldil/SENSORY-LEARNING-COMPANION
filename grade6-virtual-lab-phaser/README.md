# Grade 6 Science Virtual Lab (PhET-style) — React + Phaser + Express + MongoDB

This project is a **labs-only** platform with **PhET-like simulations** built in **Phaser** and wrapped in **React**.
A simple **Express + MongoDB** backend stores lab definitions and each student's recorded observations.

## Features
- Lab list -> Lab player
- Phaser simulations (real-time, interactive)
- "Record Reading" button snapshots live measurements into an Observation Table
- Results stored in MongoDB (per studentId + lab)

## Included Labs (Phaser Scenes)
- **BUOYANCY_BASICS**: Float/sink with density changes (keyboard)
- **ELECTRICITY_CIRCUIT**: Click nodes to connect wires; resistance changes brightness/current
- **WATER_EVAPORATION**: Temperature + wind changes evaporation rate continuously

## Requirements
- Node.js 18+
- MongoDB (local) or Docker

## Quick Start

### 1) Start MongoDB
Docker example:
```bash
docker run -d --name g6lab-mongo -p 27017:27017 mongo:7
```

### 2) Server
```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

Server runs at: http://localhost:4000

### 3) Client
```bash
cd ../client
cp .env.example .env
npm install
npm run dev
```

Client runs at: http://localhost:5173/labs

## Run both (from project root)
```bash
npm install
npm run seed
npm run dev
```

## Controls inside simulations
- **Buoyancy**: Drag block. Use **Left/Right** arrows to change block density.
- **Electricity**: Click two nodes to connect/remove a wire. Use **Up/Down** arrows to change resistance.
- **Water evaporation**: **Up/Down** temperature, **Left/Right** wind.

## Add a new lab (Phaser style)
1. Create a new Scene in `client/src/components/sim/scenes/MyScene.js`
2. Register it in `client/src/components/sim/SimHost.jsx` SceneMap
3. Add a lab document in MongoDB (or edit seed and re-run):
   - `labKey: "MY_NEW_LAB"`
   - `config: {...}` values used by your scene

---
