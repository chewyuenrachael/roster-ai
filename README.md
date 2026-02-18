# 🏥 RosterAI

**Smart shift allocation system for doctors** — An AI-powered tool that fairly distributes on-call duties based on a points system, while respecting leave requests and call preferences.

![RosterAI Screenshot](https://img.shields.io/badge/Status-MVP-green) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple)

## 🔴 The Problem

Currently, hospital shift allocation is a slow manual process:

1. **Doctors** indicate their availability by coloring cells on a shared spreadsheet (AL, CB, etc.)
2. **The "Roster Monster"** (a designated person) manually creates the schedule, trying to:
   - Ensure fair distribution of calls
   - Maiximise fulfilling leave requests
   - Balance weekend duties
   - Maintain minimum staffing per team
3. This takes **hours of work** each month and often results in disputes over fairness

**RosterAI automates this entire process** — doctors input their preferences, and the AI generates a fair roster in seconds.

---

## ✨ Features

### 📅 Handover View (`/today`)
Quick access to "Who's on call today/tomorrow?" — the most frequently used feature.

```
┌─────────────────────────────────────────┐
│  📅 TODAY - Mon, 6 Jan 2025            │
├─────────────────────────────────────────┤
│  🔴 HO1 (Active)     Dr. Sarah Chen    │
│  🟠 HO2 (Passive)    Dr. Marcus Wong   │
│  🟡 HO3 (Handover)   Dr. Emily Tan     │
│  🟢 HO4              Dr. Raj Sharma    │
├─────────────────────────────────────────┤
│  😴 Post-Call: Dr. Jessica Lim         │
│  🏖️ On Leave: Dr. David Ng            │
└─────────────────────────────────────────┘
          ⬇️ HANDOVER TO ⬇️
┌─────────────────────────────────────────┐
│  📅 TOMORROW - Tue, 7 Jan 2025         │
│  ...                                    │
└─────────────────────────────────────────┘
```

- **Today & Tomorrow view** — See which doctors to handover to
- **Navigate any date** — Browse past and future rosters
- **Copy to clipboard** — One tap to share via message
- **Search by doctor** — Find any doctor's upcoming calls

### 📋 My Calls (`/mycalls`)
View any doctor's complete call schedule for the month.

- **Expandable doctor cards** — Tap to see full details
- **Statistics breakdown** — Total calls, weekday/weekend split, calls per HO tier
- **Timeline view** — All upcoming calls in chronological order
- **Copy schedule** — Share via clipboard

### 🏥 Ward Coverage (`/coverage`)
See which wards each on-call tier covers and their responsibilities.

| HO Tier | Wards Covered | Responsibilities |
|---------|---------------|------------------|
| HO1 | ED, Surgical ICU, HDU | New admissions, ICU reviews, Trauma calls |
| HO2 | Wards 45-48 | Ward reviews, Nurse escalations, IV cannulations |
| HO3 | Wards 41-44 | Evening handovers, Discharge summaries, Leaves 10pm |
| HO4 | Day Surgery, Clinics | Elective support, Clinic overflow |

### 💊 Antibiotic Guidelines (`/abx`)
Quick reference antibiotic guidelines by body system.

- **Systems**: Respiratory, Intra-abdominal, Skin & Soft Tissue, Urinary, CNS, Sepsis
- **Severity tiers**: Mild → Moderate → Severe regimens
- **Expandable cards** — Tap condition to see full guidelines

### ⚙️ Configurable HO Tiers (HO1-HO11)
Different hospitals use different call structures. RosterAI supports 1-11 HO tiers, each configurable with:

- Custom name/description
- Post-call entitlement (Yes/No)
- Point multiplier
- Required staffing per day

---

## 📋 Call Points System

Weekend rounds are worth more points to compensate for the inconvenience:

| Day | HO1/HO2 Points | HO3 Points |
|-----|----------------|------------|
| Mon-Thu | 1.0 | 0.5 |
| Friday | 1.5 | 0.75 |
| **Saturday** | **2.5** | **1.25** |
| Sunday | 2.0 | 1.0 |

---

## 🏷️ Call Types

| Type | Description | Post-Call? |
|------|-------------|------------|
| **HO1** | Active On-Call — Reviews new cases with on-call team | ✅ Yes |
| **HO2** | Passive On-Call — First line for ward nurse escalations | ✅ Yes |
| **HO3** | Handover HO — Reviews handovers, leaves at 10pm | ❌ No |
| **HO4** | Additional coverage (configurable) | Configurable |
| **PC** | Post-Call — Rest day after HO1/HO2 duty | — |

---

## 🚫 Request Types

| Type | Description | Priority |
|------|-------------|----------|
| **AL** | Annual Leave — Day off work | 1 (Highest) |
| **CB** | Call Block — "I don't want to be on call this day" | 2 |
| **CR** | Call Request — "I want to be on call this day" | 3 |

---

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

---

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

---

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Styling**: CSS-in-JS (embedded styles)

---

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

---

## 🗺️ Roadmap

- [x] Handover View (Today/Tomorrow)
- [x] My Calls (Doctor schedule lookup)
- [x] Ward Coverage view
- [x] Antibiotic Guidelines reference
- [x] Configurable HO tiers (1-11)
- [ ] User authentication (login per doctor)
- [ ] Database integration (persist rosters)
- [ ] Export to PDF/Excel
- [ ] Email notifications when roster is published
- [ ] Shift swap requests between doctors
- [ ] Mobile-responsive design improvements
- [ ] Historical roster viewing
- [ ] Integration with hospital systems

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by real hospital rostering challenges
- Built to make doctors' lives easier
- Call point system based on Singapore hospital practices

---

<p align="center">
  Made with ❤️ for healthcare workers
</p>
