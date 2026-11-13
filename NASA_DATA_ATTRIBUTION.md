# 🛰️ NASA Data & Resource Attribution

**Jr_AstroCamp · Team Mysterio**  
**NASA International Space Apps Challenge 2026**

This document details the NASA open datasets, mission telemetry bounds, historical archives, and scientific models integrated into **Jr_AstroCamp**.

---

## 1. NASA Mission Catalog & Historical Datasets
* **Mission Dataset:** 76 historical NASA missions compiled in [`nasa_missions_catalog.csv`](./nasa_missions_catalog.csv) and [`nasaMissionCatalog.ts`](./src/data/nasaMissionCatalog.ts).
* **Programs Covered:**
  - **Project Mercury:** Freedom 7, Liberty Bell 7, Friendship 7, Aurora 7, Sigma 7, Faith 7.
  - **Project Gemini:** Gemini 3 through Gemini 12 (Orbital rendezvous, EVAs, docking).
  - **Apollo Program:** Apollo 1 through Apollo 17 (Saturn V launch trajectories, lunar descent, CSM docking).
  - **Skylab & Apollo-Soyuz:** Space station solar observations, international docking.
  - **Space Transportation System (Shuttle):** STS-1, STS-7, STS-31 (Hubble deployment), STS-51-L, STS-107, STS-135.
  - **Artemis Program:** Artemis I, Artemis II (Orion deep space trajectory), Artemis III lunar south pole landing.
  - **Mars Exploration:** Viking 1 & 2, Pathfinder / Sojourner, Spirit, Opportunity, Curiosity, Perseverance / Ingenuity.
  - **Lagrange & Deep Space Observatories:** Hubble Space Telescope, James Webb Space Telescope (JWST), Nancy Grace Roman, Parker Solar Probe, New Horizons, Voyager 1 & 2.

---

## 2. Integrated NASA Data Sources & Live Telemetry

| Dataset / Source | Direct URL | Utilization & Mechanics |
| :--- | :--- | :--- |
| **Astronomy Picture of the Day (APOD)** | [https://api.nasa.gov/planetary/apod](https://api.nasa.gov/planetary/apod) | In the NASA Live Observatory panel, it fills the daily-image card with the image, title, date, copyright credit, and explanation, and the image opens at its high-res URL. A bundled sample is used if the request fails. |
| **Near Earth Object Web Service (NeoWs)** | [https://api.nasa.gov/neo/rest/v1/feed](https://api.nasa.gov/neo/rest/v1/feed) | The Near-Earth Asteroid Radar lists up to six objects from today’s feed, with name, estimated diameter, hazardous flag, approach date, miss distance, and relative speed. Sample records are used if the feed is unavailable or empty. |
| **NASA Image and Video Library** | [https://images.nasa.gov/](https://images.nasa.gov/) | The NASA Image Library modal sends the student’s search term to the image API and shows up to 24 matching records with thumbnails and metadata. In some views, students can apply a selected image as the scene background. |
| **Apollo Passive Seismic Experiment (PSE)** | [https://pds-geosciences.wustl.edu/missions/apollo/pse.htm](https://pds-geosciences.wustl.edu/missions/apollo/pse.htm) | A bundled JSON list of moonquake dates, coordinates, and magnitudes is plotted on the 3D Moonquake Map, where students can filter by year and select an event. The animated seismograph is generated from the event’s magnitude, not a recorded waveform, and nothing is queried live. |
| **NASA NSSDC Master Catalog** | [https://nssdc.gsfc.nasa.gov/nmc/](https://nssdc.gsfc.nasa.gov/nmc/) | Our curated 76-row mission CSV and TypeScript catalog power the Learning Hub, where students filter missions by program and status and read each objective and operational guide. Curated summaries, not a live import. |
| **NASA BVAD Report** | [https://ntrs.nasa.gov/citations/20150002905](https://ntrs.nasa.gov/citations/20150002905) | In the lunar/Mars outpost simulation, crew oxygen, water, and food needs inform resource depletion and recycling choices. The game turns them into simplified per-turn percentages and thresholds and doesn’t read the report at runtime. |
| **MSL REMS & Perseverance MEDA** | [MSL REMS](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html) / [Perseverance MEDA](https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/) | The NASA Live Observatory shows a fixed Mars-weather sample (temperature, pressure, wind, conditions) for context. It is not a live feed. |
| **LRO LOLA Archive** | [https://pds-geosciences.wustl.edu/missions/lro/lola.htm](https://pds-geosciences.wustl.edu/missions/lro/lola.htm) | Referenced for lunar elevation, polar terrain, and lighting concepts in the rover and outpost scenarios. The game doesn’t load LOLA elevation grids, and its terrain and resource rules are simplified. |
| **LCROSS Mission Results** | [https://science.nasa.gov/mission/lcross/](https://science.nasa.gov/mission/lcross/) | Gives context for the rover’s lunar ice-recovery learning scenario. The in-game extraction amount and reward are simplified, not calculated from LCROSS spectra. |
| **NASA DONKI** | [https://kauai.ccmc.gsfc.nasa.gov/DONKI/](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) | Informs the solar-storm and radiation-shelter scenarios. Event timing and dose/shielding values are scripted game inputs, and the app never queries DONKI. |
| **LRO CRaTER** | [https://crater.unh.edu/](https://crater.unh.edu/) | Reference for the radiation-shelter scenario alongside DONKI. No CRaTER measurements are ingested. |
| **MGS MOLA Archive** | [https://pds-geosciences.wustl.edu/missions/mgs/mola.html](https://pds-geosciences.wustl.edu/missions/mgs/mola.html) | Cited for Mars elevation and landing-site context. No MOLA elevation grid is loaded by the game. |
| **NASA NTRS KRUSTY Records** | [https://ntrs.nasa.gov/search?q=KRUSTY](https://ntrs.nasa.gov/search?q=KRUSTY) | Grounds the outpost’s Kilopower option in the NASA/LANL fission-power test program. The game’s continuous power output is a simplified gameplay value, not telemetry. |

---

## 3. Other Space Agency & Third-Party Datasets
* **Other Space Agency Data:** None. The project does not currently ingest a separate ESA, JAXA, CSA, or ISRO dataset.
* **Third-Party Live Datasets:**
  - **Where the ISS at API ([https://api.wheretheiss.at/v1/satellites/25544](https://api.wheretheiss.at/v1/satellites/25544)):** The NASA Live Observatory gets the ISS latitude, longitude, altitude, and speed from it, refreshing every 15 seconds. It is a third-party service, not a NASA or partner-agency feed.

---

## 2. Scientific Constants & Planetary Physics Models
The environmental parameters and physical constants used across the Pygame and Three.js engines are grounded in published NASA Glenn Research Center and JPL planetary ephemerides:
* **Gravity Models:** Earth ($9.81 \text{ m/s}^2$), Moon ($1.62 \text{ m/s}^2$), Mars ($3.72 \text{ m/s}^2$), Titan ($1.35 \text{ m/s}^2$), Europa ($1.315 \text{ m/s}^2$).
* **Atmospheric Drag & Scale Heights:** NASA Earth Atmosphere Model (US Standard Atmosphere 1976) and Mars atmospheric density profiles.
* **Thermal & Radiation Environmental Telemetry:** Lunar day/night surface temperature ranges ($-130^\circ\text{C}$ to $+120^\circ\text{C}$), Solar Particle Event (SPE) fluxes, and Galactic Cosmic Radiation (GCR) dosimetric constants (sourced from NASA LRO CRaTER and MSL RAD data).

---

## 3. NASA Media & Archival Assets
* **Audio & Communications:** Quindar tones, Houston CapCom transcripts, and launch cadence audio cues synthesized based on Apollo and Shuttle historical air-to-ground voice recordings.
* **Mission Imagery & Diagrams:** Public-domain mission diagrams, patch designs, and technical schematics from NASA Technical Reports Server (NTRS) and NASA Image and Video Library (`images.nasa.gov`).

---

## 4. Open-Source Data Flow Architecture
```
NASA NTRS & Open APIs (data.nasa.gov / api.nasa.gov)
          │
          ▼
nasa_missions_catalog.csv (76 Historical Records)
     ┌────┴─────────────────────────────┐
     ▼                                  ▼
Python/Pygame 60 FPS Sim         React 19 Web Companion
• Trajectory & Staging Math       • Outpost Life Support Sim
• Real-time Telemetry Loop        • Digital Mission Notebooks
• Debrief & Causal Autopsy        • Multimodal Audio & Comics
```
