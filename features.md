# RosterAI - Requirements Specification Document

## Purpose
This document captures all requirements for the automated doctor shift allocation system. Please review and confirm each section.

---

## 1. USER ROLES & PERMISSIONS

### 1.1 Doctors
- [ ] Can submit Annual Leave (AL) requests
- [ ] Can submit Call Block (CB) - days they don't want to be on call
- [ ] Can submit Call Request (CR) - days they want to be on call
- [ ] Can view their own schedule and cumulative call points
- [ ] Can see the final published roster

### 1.2 Roster In-Charge (Roster Monster)
- [ ] Can view all doctor submissions (AL, CB, CR)
- [ ] Can see conflicts and manpower shortages
- [ ] Can manually adjust allocations if needed
- [ ] Can generate/regenerate the roster
- [ ] Can publish the final roster

### 1.3 Admin / Approving Doctor
- [ ] Can approve or reject AL requests
- [ ] Final sign-off on the roster before publishing

---

## 2. INPUT: DOCTOR SUBMISSIONS

### 2.1 Types of Requests (via calendar interface)

| Type | Code | Description | Priority |
|------|------|-------------|----------|
| Annual Leave | AL | Day off work (approved absence) | 1 (Highest) |
| Birthday Leave | BL | Special leave for birthday | 1 |
| Call Block | CB | "I don't want to be on call this day" | 2 |
| Call Request | CR | "I want to be on call this day" | 3 |

### 2.2 Submission Limits
- [ ] Maximum 2 Call Blocks per month? (Confirm limit)
- [ ] Maximum 2 Call Requests per month? (Confirm limit)
- [ ] Submission deadline: 2nd Friday of the month? (Confirm)

### 2.3 Common Patterns to Support
- **Leave Maximization Strategy**: CR on Thursday → Post-call Friday → CB Saturday & Sunday → AL from Monday
- **Weekend Protection**: When taking AL on Friday or Monday, doctors typically CB the adjacent weekend

---

## 3. ALLOCATION RULES & CONSTRAINTS

### 3.1 Call Types (per day)

| Call Type | Role | Post-Call Next Day? |
|-----------|------|---------------------|
| HO1 | Active On-Call: Reviews new cases with on-call team | Yes |
| HO2 | Passive On-Call: First line for ward nurse escalations | Yes |
| HO3 | Handover HO: Reviews handovers, leaves at 10pm | No |
| HO4 | Additional coverage (if applicable) | Confirm |

**Question**: Does your hospital use HO1/HO2/HO3/HO4, or a different system?

### 3.2 Call Point System

| Day | Points (HO1/HO2) | Points (HO3) |
|-----|------------------|--------------|
| Monday - Thursday | 1.0 | 0.5 |
| Friday | 1.5 | 0.75 |
| Saturday | 2.5 | 1.25 |
| Sunday | 2.0 | 1.0 |
| Public Holiday | 2.5 | 1.25 |

### 3.3 Fairness Rules

| Rule | Description | Confirmed? |
|------|-------------|------------|
| Equal total calls | Each doctor should have roughly equal calls over the posting period (4 months for HO, 6 months for MO) | [ ] |
| No EOD calls | No "Every Other Day" calls - minimum 2 days gap between calls | [ ] |
| Weekend spread | Spread weekend calls fairly - not too many weekends for one person | [ ] |
| Call type variety | Each doctor should rotate through HO1, HO2, HO3 fairly | [ ] |
| Cumulative tracking | Look back at previous months to ensure fairness across the entire posting | [ ] |

### 3.4 Minimum Staffing Requirements

**Per Team Per Day:**

| Team | Min Staff Required | Notes |
|------|-------------------|-------|
| ESU (Emergency Surgical Unit) | ? | Takes ED admissions - busier |
| ACS (Acute Care Surgery) | ? | |
| HPB (Hepatobiliary) | ? | |
| CLR (Colorectal) | ? | |
| VAS (Vascular) | ? | |
| URO (Urology) | ? | |
| NES (Neurosurgery) | ? | |
| PRAS (Plastic Surgery) | ? | |
| BRS (Breast) | ? | |
| UGI (Upper GI) | ? | |

**Question**: What are the minimum staffing numbers for each team?

### 3.5 Post-Call Coverage (Float System)

- [ ] Does your department have a float system?
- [ ] How many float staff per month?
- [ ] Float jumps to cover whoever is post-call each day?
- [ ] Any other post-call coverage rules?

---

## 4. TRACKING & HISTORICAL DATA

### 4.1 Posting Periods

| Staff Type | Posting Duration | Tracking Window |
|------------|------------------|-----------------|
| House Officers (HO) | 4 months | Look back 3 months + current month |
| Medical Officers (MO) | 6 months | Look back 5 months + current month |

### 4.2 Metrics to Track Per Doctor

| Metric | Description |
|--------|-------------|
| Total Calls | Sum of all calls in posting period |
| Weekend Calls | Count of Sat/Sun calls |
| Weekday Calls | Count of Mon-Fri calls |
| HO1 Count | Number of HO1 (active) calls |
| HO2 Count | Number of HO2 (passive) calls |
| HO3 Count | Number of HO3 (handover) calls |
| HO4 Count | Number of HO4 calls (if applicable) |
| Day Points | Points based on day type |
| Cumulative Points | Running total across posting |

### 4.3 Target Numbers (Per Month)

- [ ] Target calls per doctor per month: ~4-5? (Confirm)
- [ ] Maximum calls per doctor per month: ? (Confirm)
- [ ] Minimum calls per doctor per month: ? (Confirm)

---

## 5. CONFLICT RESOLUTION

### 5.1 Priority Order for Allocation

1. **Annual Leave / Birthday Leave** - Always honored (pre-approved)
2. **Call Block** - Try to honor, but may be overridden if insufficient manpower
3. **Call Request** - Try to honor, allocate to requester if date is available

### 5.2 Conflict Scenarios

| Scenario | Resolution |
|----------|------------|
| Too many people on AL same day | Flag to admin - may need to reject some AL |
| Too many CB on same day causing shortage | Flag to roster in-charge - need manual deconfliction |
| Multiple CR for same day/slot | Allocate to person with fewer points |
| Cannot meet minimum staffing | Alert roster in-charge - manual intervention needed |

### 5.3 Roster In-Charge Pain Points to Address

- [ ] Automatic detection of manpower shortages
- [ ] Highlight days with conflicts
- [ ] Show reasons for each request (from doctor's notes)
- [ ] Suggest alternatives when conflicts arise
- [ ] Easy manual override capability

---

## 6. OUTPUT: ROSTER VIEWS

### 6.1 Monthly Roster View (Calendar Style)
- Grid showing all doctors × all days
- Color-coded by shift type (HO1, HO2, HO3, AL, PC, etc.)
- Show team groupings
- Daily totals row (how many on each call type)

### 6.2 Daily View
- Who is HO1, HO2, HO3, HO4 for each day
- Who is on AL
- Who is post-call
- Which teams have coverage

### 6.3 Statistics Dashboard
- Points leaderboard
- Call distribution charts
- Weekend vs weekday distribution
- Per-doctor breakdown

### 6.4 Export Options
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Sync to calendar (Google/Outlook)

---

## 7. WORKFLOW

### 7.1 Monthly Timeline

| When | What |
|------|------|
| Start of month | Previous month's roster is active |
| 1st week | Doctors submit AL/CB/CR for next month |
| 2nd Friday | Submission deadline |
| 2nd-3rd week | Roster in-charge generates & reviews |
| 3rd week | Conflicts resolved, adjustments made |
| 4th week | Final roster approved & published |
| End of month | Next month's roster goes live |

### 7.2 Notification Triggers
- [ ] Reminder to submit requests before deadline
- [ ] Notification when roster is published
- [ ] Alert if your request was not honored (with reason)
- [ ] Alert to roster in-charge when conflicts detected

---

## 8. QUESTIONS FOR CONFIRMATION

Please confirm or clarify the following:

1. **Call Types**: Do you use HO1/HO2/HO3/HO4, or different names?

2. **Minimum Staffing**: What are the minimum staff requirements per team?

3. **Float System**: Does your department have a float system for post-call coverage?

4. **Submission Limits**: How many CB/CR can each doctor submit per month?

5. **Target Calls**: What is the target number of calls per doctor per month?

6. **Approval Workflow**: Who approves AL - just admin, or also a senior doctor?

7. **Special Rules**: Any other department-specific rules not mentioned above?

8. **Teams**: What are all the teams in your department?

---

## 9. TECHNICAL NOTES

### Data to Import
- Doctor list with current team assignments
- Historical call data (for cumulative tracking)
- Team configurations and minimum staffing
- Public holiday calendar

### Integrations Needed
- [ ] Google Forms (for submissions)?
- [ ] Hospital HR system (for AL approval)?
- [ ] Calendar sync?
- [ ] Email notifications?

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Status: DRAFT - Pending Doctor Review*