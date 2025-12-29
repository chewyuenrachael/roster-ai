# 🏥 RosterAI

**Smart shift allocation system for doctors** — An AI-powered tool that fairly distributes on-call duties based on a points system, while respecting leave requests and call preferences.

![RosterAI Screenshot](https://img.shields.io/badge/Status-MVP-green) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## 🔴 The Problem

Currently, hospital shift allocation is a painful manual process:

1. **Doctors** indicate their availability by coloring cells on a shared spreadsheet (AL, CB, etc.)
2. **The "Roster Monster"** (a designated person) manually creates the schedule, trying to:
   - Ensure fair distribution of calls
   - Respect everyone's leave requests
   - Balance weekend duties
   - Maintain minimum staffing per team
3. This takes **hours of work** each month and often results in disputes over fairness

**RosterAI automates this entire process** — doctors input their preferences, and the AI generates a fair roster in seconds.

## ✨ Features

### For Doctors
- **📅 Mark Availability** — Set Annual Leave (AL), Call Blocks (CB), and Call Requests (CR) on an interactive calendar
- **🎯 Leave Maximization** — Strategic tips to maximize consecutive days off (e.g., CR Thursday → PC Friday → CB Weekend → AL Monday)
- **📊 Points Tracking** — View your cumulative call points and see how the fair allocation works

### For Roster Managers
- **🤖 AI-Powered Allocation** — Automatically generates fair rosters based on cumulative points
- **⚖️ Fair Distribution** — Doctors with lowest points get assigned calls first
- **👥 Team-Based View** — See all doctors grouped by their teams (ESU, NES, VAS, etc.)
- **📈 Statistics Dashboard** — Track call distribution and points leaderboard

## 📋 Call Points System

Weekend rounds are worth more points to compensate for the inconvenience:

| Day | HO1/HO2 Points | HO3 Points |
|-----|----------------|------------|
| Mon-Thu | 1.0 | 0.5 |
| Friday | 1.5 | 0.75 |
| **Saturday** | **2.5** | **1.25** |
| Sunday | 2.0 | 1.0 |

## 🏷️ Call Types

| Type | Description |
|------|-------------|
| **HO1** | Active On-Call — Reviews new cases with on-call team |
| **HO2** | Passive On-Call — First line for ward nurse escalations |
| **HO3** | Handover HO — Reviews handovers, leaves at 10pm, no post-call |
| **PC** | Post-Call — Rest day after HO1/HO2 duty |

## 🚫 Request Types

| Type | Description | Use Case |
|------|-------------|----------|
| **AL** | Annual Leave | Day off work |
| **CB** | Call Block | "I don't want to be on call this day" |
| **CR** | Call Request | "I want to be on call this day" |

## 💡 Leave Maximization Strategy

The smart way to maximize your time off:

```
Thursday: Call Request (CR)
   ↓
Friday: Work until 8am-12pm, then Post-Call (PC)
   ↓
Saturday & Sunday: Call Block (CB)
   ↓
Monday onwards: Annual Leave (AL)
   
= Maximum consecutive days off! 🎉
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/roster-ai.git

# Navigate to project directory
cd roster-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Styling**: CSS-in-JS (embedded styles)

## 📁 Project Structure

```
roster-ai/
├── src/
│   ├── App.jsx          # Main application code
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🗺️ Roadmap

- [ ] User authentication (login per doctor)
- [ ] Database integration (persist rosters)
- [ ] Export to PDF/Excel
- [ ] Email notifications when roster is published
- [ ] Shift swap requests between doctors
- [ ] Mobile-responsive design improvements
- [ ] Historical roster viewing
- [ ] Integration with hospital systems

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by real hospital rostering challenges
- Built to make doctors' lives easier
- Call point system based on Singapore hospital practices

---

<p align="center">
  Made with ❤️ for healthcare workers
</p>