# RecoverX — AML & Mule Account Detection Platform

RecoverX is a high-performance intelligence layer designed for modern banking (specifically optimized for **Indian Overseas Bank**) to detect, neutralize, and recover funds from mule account networks.

![RecoverX Dashboard](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070)

## 🚀 Key Features

- **Multimodal Onboarding Risk Engine**: 5-step async verification (Identity, Device, Telecom, Velocity, Behavior).
- **Threat Intelligence Score (TIS)**: Real-time risk scoring for accounts using network centrality and transaction pathing.
- **Predictive Movement Analysis**: ML-driven prediction of the next "hop" in a money laundering chain.
- **Graph Engine**: Relationship mapping to visualize complex mule networks.
- **Emergency "Kill Switch"**: Instant freezing of entire connected networks to prevent fund layering.

## 🧠 Core Algorithms

1. **Behavioral Telemetry**: Detects bots via machine-like keystroke cadence (σ < 15ms) and mouse entropy.
2. **Identity Intelligence**: Real-time PAN/Aadhaar validation and ID re-use detection.
3. **Chain Depth Analysis**: Traces funds up to 5 hops to identify "layering" phases.
4. **Velocity Checks**: Rolling 1-hour window monitoring for IP and device-based signup spikes.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Animations**: Framer Motion
- **Charts**: Chart.js
- **Styling**: Vanilla CSS (Cyber-Grid Design System)
- **Deployment**: Optimized for Vercel

## 📦 Installation

```bash
git clone https://github.com/YOUR_USERNAME/RecoverX.git
cd RecoverX
npm install
npm run dev
```

## 📄 License

Proprietary - Developed for IOB Hackathon.
