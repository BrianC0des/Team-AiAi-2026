<div align="center">

# ScanAble

**Before you throw it away — scan it.**

An AI-powered sustainability web application that evaluates the salvageability of everyday household items and routes them toward repair, donation, reuse, or recycling.

[![SDG 12](https://img.shields.io/badge/UN%20SDG-12%20Responsible%20Consumption-green)](https://sdgs.un.org/goals/goal12)
[![Status](https://img.shields.io/badge/Status-Hackathon%20Build-blue)]()
[![License](https://img.shields.io/badge/License-MIT-lightgrey)]()

</div>

---

## The Problem

### Background

The world generates **2.01 billion tons of solid waste annually** and an estimated **40% of discarded items are still salvageable**. They end up in landfills because people default to the path of least resistance: throw it away.

In the Philippines, **Republic Act 9003** — the Ecological Solid Waste Management Act — has mandated proper waste segregation since 2001, yet compliance remains inconsistent across many barangays and municipalities. The barrier is rarely willingness. It is knowledge. Most people simply don't know whether an item is still useful, who might want it, or what to do with it beyond throwing it away.

Existing recycling and sustainability apps tell users **where to throw something** — recycling centers, drop-off points, waste facilities. What none of them do is help users answer the question that comes first: **should this be thrown away at all?**

### Relevance to SDG 12

ScanAble directly addresses **UN Sustainable Development Goal 12: Responsible Consumption and Production**, specifically:

- **Target 12.5** — By 2030, substantially reduce waste generation through prevention, reduction, recycling, and reuse
- **Target 12.8** — Ensure that people everywhere have relevant information and awareness for sustainable development and lifestyles in harmony with nature

By intercepting the disposal decision at its source — the moment a person holds an item and considers discarding it — ScanAble operates at the most critical and underserved point in the consumption lifecycle.

---

## The Solution

### What is ScanAble?

ScanAble is a web application that puts an AI-powered second opinion between a user's hand and the trash can. Users upload a photo of any household item — worn clothing, a broken appliance, old furniture, unused supplies — and the system analyzes its condition and determines whether it can be repaired, donated, reused, recycled, or responsibly disposed of.

### How It Works

```
User uploads photo → Optional description added
        ↓
The Agent analyzes item — category, condition, confidence, hazard flag
        ↓
Server-side safety check — hardcoded hazard routing overrides AI for dangerous items
        ↓
Recommendation engine resolves path — repair · donate · reuse · recycle · dispose
        ↓
Result card displayed — condition summary, recommendation, SDG impact note
        ↓
Impact counter updated — personal and global waste diversion stats
```

### Key Features and User Benefits

**AI Condition Analysis**
Upload a photo and get an instant, plain-language assessment of your item's condition — no sustainability expertise required.

**Five Supported Categories**

| Category | Covers |
|---|---|
| Wearables | Clothing, footwear, bags, accessories, linens |
| Electronics | Small appliances, non-CRT office devices |
| Household | Furniture, kitchen and dining items, storage |
| Recreational | Books, toys, sports gear, musical instruments |
| Supplies | Office supplies, art materials, garden tools |

**Smart Routing, Not Just Recycling**
Items are never just pointed to a bin. ScanAble routes each item to the right second-life path — repair, donation, reuse, recycling, or safe disposal — based on actual condition.

**Safety-First Hazard Handling**
Batteries, CRT monitors, refrigerants, and medical waste are routed through a hardcoded disposal guide that bypasses the AI entirely. Safety-critical decisions are never left to model judgment.

**The Pile System**
Build up a list of analyzed items grouped by recommendation type. When the pile reaches a meaningful threshold, the app suggests one efficient trip — realistic payoff, minimal effort.

**Personal and Global Impact Tracking**
Every completed analysis increments both a personal counter and a global counter tracking total items diverted from landfill, visible in real time on the home screen.

**No Forced Sign-Up**
Scan freely as a guest. Create an account later and transfer your full analysis history — no data lost, no registration wall.

---

## Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat&logo=railway&logoColor=white)

### Database & Storage
![Firebase](https://img.shields.io/badge/Firestore-FFCA28?style=flat&logo=firebase&logoColor=black)
![Firebase Storage](https://img.shields.io/badge/Firebase%20Storage-FFCA28?style=flat&logo=firebase&logoColor=black)
![Firebase Auth](https://img.shields.io/badge/Firebase%20Auth-FFCA28?style=flat&logo=firebase&logoColor=black)

### AI
![Gemini](https://img.shields.io/badge/Gemini%202.5-4285F4?style=flat&logo=google&logoColor=white)

---

## The Team

| Name | Role | GitHub | LinkedIn |
|---|---|---|---|
| Marc de Zena | Mentor | [GitHub](#) | [LinkedIn](#) |
| Nur-Mohammad Zaarr L. Iraji | Team Lead & Backend development | [GitHub](https://github.com/meekoUrabe) | [LinkedIn](#) |
| Bryan P. Saavedra | Backend Development | [GitHub](https://github.com/BrianC0des) | [LinkedIn](#) |
| Carl Marcel D. Mapa | Frontend Development | [GitHub](https://github.com/Akizenoko) | [LinkedIn](#) |
| Landis Angelo J. Tarro | Pitch & Presentation | [GitHub](https://github.com/S4tori33) | [LinkedIn](#) |
| Norielle John D. Buhawe | Research & Documentation | [GitHub](https://github.com/Itzsssnori) | [LinkedIn](#) |
---

<div align="center">

**ScanAble** — Built for the hackathon. Built for the planet.

*"Before you throw it away — scan it."*

</div>
