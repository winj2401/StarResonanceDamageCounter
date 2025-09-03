# Star Resonance Real-time Combat Data Counter (Star Resonance Damage Counter)

## Braindead Instructions
1. Download and install [npcap](https://npcap.com/dist/npcap-1.83.exe)
1. Download [star-resonance-damage-counter.exe](https://github.com/winjwinj/StarResonanceDamageCounter/releases/latest/download/star-resonance-damage-counter.exe) and run in its own folder

    <sub><sup>Since it will store settings, log history, etc. in the current folder (`settings.json`, `logs`, `users.json`)</sup></sub>
1. Browser window should open in http://localhost:8989/ (port might be different)
<img width="2460" height="1170" alt="image" src="https://github.com/user-attachments/assets/40e284b9-fc4d-4471-849f-679525bdd2ad" />

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-brightgreen.svg)](https://www.gnu.org/licenses/agpl-3.0.txt)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.13.1-orange.svg)](https://pnpm.io/)

A real-time combat data counter for the game "Star Resonance". It captures and analyzes combat packets on the network in real time to provide damage statistics, DPS calculations, and more.

The accuracy of this tool has been verified through multiple real combat tests. Under stable network conditions, no data loss has been found.

This tool does not modify the game client and does not violate the game's Terms of Service. It is intended to help players better understand combat data, reduce wasted optimizations, and improve game experience. Please ensure the data and results from this tool are not used in ways that damage the community (e.g., discriminatory ranking based on combat data).

[Intro video](https://www.bilibili.com/video/BV1T4hGzGEeX/)

## ✨ Features

- 🎯 Real-time damage tracking — capture and aggregate damage data during combat in real time
- 📊 DPS calculation — provide both instantaneous DPS and overall DPS calculations
- 🎲 Detailed breakdown — distinguish normal damage, critical strikes, lucky hits, etc.
- 🌐 Web UI — a polished real-time dashboard with line charts
- 🌙 Theme switch — support for light/dark mode
- 🔄 Auto-refresh — data updates continuously without manual reload
- 📈 Analytics — detailed statistics like crit rate and lucky trigger rate

## 🚀 Quick Start

### One-click (official builds)

Visit the GitHub Actions page or Releases to download the latest prebuilt binary.

- GitHub Actions: https://github.com/dmlgzs/StarResonanceDamageCounter/actions
- Releases: https://github.com/dmlgzs/StarResonanceDamageCounter/releases

### Manual build

#### Requirements

- Node.js >= 22.15.0
- pnpm >= 10.13.1
- WinPcap / Npcap (packet capture driver)
- Visual Studio Build Tools (for native module compilation)
  - Install from Visual Studio Installer and select the "C++ build tools" workload
- Python 3.10 (for some build tasks)

#### Install steps

1. Clone the repository

   ```powershell
   git clone https://github.com/dmlgzs/StarResonanceDamageCounter.git
   cd StarResonanceDamageCounter
   ```

2. Install dependencies

   ```powershell
   corepack enable; pnpm install
   ```

3. Install WinPcap / Npcap

   - Download and install [Npcap](https://nmap.org/npcap/) or [WinPcap](https://www.winpcap.org/) (Npcap is recommended).
   - Make sure to enable "WinPcap API-compatible mode" during the Npcap installer if required.

4. Run

   ```powershell
   node server.js
   ```

   On startup the CLI will prompt:
   - choose a network device for packet capture (match the number shown in the list)
   - choose log level (`info` for normal, `debug` for verbose)

   You may also pass parameters on the CLI:

   ```powershell
   node server.js <device_number> <log_level>
   ```

   Or use automatic detection mode (recommended):

   ```powershell
   node server.js auto info
   ```

   Automatic detection will:
   - try to pick a real physical interface and ignore virtual adapters (ZeroTier, VMware, etc.)
   - analyze 3 seconds of traffic to automatically choose the most active interface
   - fallback to route table method if no traffic is detected


### How to use

1. Choose the network device
   - After starting the program, a list of available network devices will be shown
   - Enter the numeric index corresponding to your main network adapter

2. Choose log level
   - `info` or `debug` (use `info` by default to reduce log noise)

3. Start the game
   - The program auto-detects the game server connection and starts collecting data

4. Open the dashboard
   - Visit: http://localhost:8989 to view real-time combat statistics

## 📱 Web UI

### Displayed information

- Character ID — unique player identifier
- Total Damage / Healing — aggregate numbers for the session
- Damage breakdown — pure critical, pure lucky, crit+luck, etc.
- Crit rate / Lucky rate — percentage stats for the session
- Instant DPS / HPS — current values per second
- Peak Instant — historical peak instant output
- Total DPS / HPS — average efficiency measured across active time

### Actions

- Clear data — reset all current statistics
- Theme switch — toggle between light/dark modes
- Auto-refresh — data updates automatically (every ~100ms)

## 🛠️ Architecture

### Main dependencies

- [cap](https://github.com/mscdex/cap) — packet capture
- [express](https://expressjs.com/) — web server
- [protobufjs](https://github.com/protobufjs/protobuf.js) — protobuf parsing
- [winston](https://github.com/winstonjs/winston) — logging

## 📡 HTTP API

### GET /api/data

Fetches the current real-time combat statistics

Response example:

```json
{
  "code": 0,
  "user": {
    "114514": {
      "realtime_dps": 0,
      "realtime_dps_max": 3342,
      "total_dps": 451.970764813365,
      "total_damage": {
        "normal": 9411,
        "critical": 246,
        "lucky": 732,
        "crit_lucky": 0,
        "hpLessen": 8956,
        "total": 10389
      },
      "total_count": {
        "normal": 76,
        "critical": 5,
        "lucky": 1,
        "total": 82
      },
      "realtime_hps": 4017,
      "realtime_hps_max": 11810,
      "total_hps": 4497.79970662755,
      "total_healing": {
        "normal": 115924,
        "critical": 18992,
        "lucky": 0,
        "crit_lucky": 0,
        "hpLessen": 0,
        "total": 134916
      },
      "taken_damage": 65,
      "profession": "Healer"
    }
  }
}
```

### GET /api/clear

Clear all collected statistics

Response example:

```json
{
  "code": 0,
  "msg": "Statistics have been cleared!"
}
```

## 🔧 Troubleshooting

### Common issues

1. Cannot detect game server
   - verify the chosen network device is correct
   - ensure the game is running and connected to the server
   - if many players are present, try moving to a less congested map area for detection

2. Web UI not accessible
   - make sure port 8989 is not blocked and is available
   - check local firewall settings

3. Abnormal statistics
   - check logs for parsing errors
   - try restarting the program to recapture the session

4. cap native module build errors
   - ensure Visual Studio Build Tools and Python are installed
   - verify Node.js version meets the requirements

5. Program exits immediately on start
   - ensure Npcap is installed and the correct network device index is provided

## 📄 License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE version 3 (AGPL-3.0). See the `LICENSE` file for the full terms.

### About derivatives

- If you modify and re-publish the source code, you must clearly indicate this project as the origin.
- If you publish a different project that references internal implementations (server detection, protocol parsing, data processing, etc.), you must clearly credit this project.

If you disagree with the license terms, please do not use or study this project.

## 👥 Contributing

Issues and pull requests are welcome.

### Contributors

[![Contributors](https://contrib.rocks/image?repo=dmlgzs/StarResonanceDamageCounter)](https://github.com/dmlgzs/StarResonanceDamageCounter/graphs/contributors "Contributors")

## ⭐ Support

If you find this project useful, please give it a star ⭐

---

**Disclaimer**: This tool is intended for learning and game data analysis purposes only. Do not use it for activities that violate the game's Terms of Service or that harm the community. The project authors are not responsible for any malicious use of this tool.
