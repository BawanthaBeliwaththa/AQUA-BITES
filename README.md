# 🐟 AQUA BITES - Automated Fish Feeding SYSTEM

![Project Banner](https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/full-ani.PNG)

> **Smart IoT Solution** • **Web & Telegram Control** • **Real-time Monitoring** • **Dual Feeding Mechanism**

## 👥 Collaborators

<table align="center" style="border-spacing: 20px; border-collapse: separate;">
  <tr>
    <td align="center" style="padding: 15px;">
      <a href="https://github.com/isinduwickramasekara">
        <img src="https://avatars.githubusercontent.com/u/220453304?v=4" width="60" style="border-radius: 50%; border: 2px solid #2a9d8f;">
      </a>
      <br />
      <strong>Isindu Wickremasinghe</strong>
      <br />
      <sub>Project Lead</sub>
    </td>
    <td align="center" style="padding: 15px;">
      <a href="https://github.com/BawanthaBeliwaththa">
        <img src="https://avatars.githubusercontent.com/u/85686518?v=4" width="60" style="border-radius: 50%; border: 2px solid #2a9d8f;">
      </a>
      <br />
      <strong>Bwantha Beliwaththa</strong>
      <br />
      <sub>Software Developer</sub>
    </td>
    <td align="center" style="padding: 15px;">
      <a href="https://github.com/LPCN">
        <img src="https://avatars.githubusercontent.com/u/136079304?v=4" width="60" style="border-radius: 50%; border: 2px solid #2a9d8f;">
      </a>
      <br />
      <strong>Navod Ranasinghe</strong>
      <br />
      <sub>3D Modal Specialist</sub>
    </td>
    <td align="center" style="padding: 15px;">
      <a href="https://github.com/Dula4">
        <img src="https://avatars.githubusercontent.com/u/214478617?v=4" width="60" style="border-radius: 50%; border: 2px solid #2a9d8f;">
      </a>
      <br />
      <strong>Dulanjana Ranasinghe</strong>
      <br />
      <sub>Hardware Specialist</sub>
    </td>
  </tr>
</table>

<div align="center">
  <a href="#-features">Features</a> •
  <a href="#-hardware-components">Hardware</a> •
  <a href="#-system-overview">Gallery</a> •
  <a href="#-getting-started">Setup</a> •
  <a href="#-firebase-setup">Firebase</a> •
  <a href="#telegram-setup">Telegram</a>
</div>

---

## ✨ Features

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #2a9d8f;">
    <h4>🌐 Web Dashboard</h4>
    <p>Beautiful interface to monitor and control feeding</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #0088cc;">
    <h4>🤖 Telegram Bot</h4>
    <p>Feed your fish from anywhere via Telegram</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #e76f51;">
    <h4>🌡️ Temperature Monitoring</h4>
    <p>Real-time water temperature tracking</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #f2cc8f;">
    <h4>⏰ Scheduled Feeding</h4>
    <p>Set automatic feeding times</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #264653;">
    <h4>🔧 Dual Feeding Mechanism</h4>
    <p>Supports both stepper motor and servo motor</p>
  </div>
  <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border-left: 4px solid #6c757d;">
    <h4>👥 User Management</h4>
    <p>Admin approval system with activity tracking</p>
  </div>
</div>

---

## 🛠️ Hardware Components

| Component | Quantity |
|-----------|----------|
| ESP32 | 1 |
| DS18B20 Temperature Sensor | 1 |
| 28BYJ-48 Stepper Motor + ULN2003 Driver | 1 |
| SG90 Servo Motor | 1 |
| Fish Food Container | 1 |
| Jumper Wires | As needed |

---

## 📸 System Overview

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  <div>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/1.PNG" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" alt="Hardware Setup">
    <p style="text-align: center; margin-top: 0.5rem;"><strong>Hardware Setup</strong></p>
  </div>
  <div>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/2.PNG" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" alt="Web Dashboard">
    <p style="text-align: center; margin-top: 0.5rem;"><strong>Web Dashboard</strong></p>
  </div>
</div>

---

## 🚀 Getting Started

### Prerequisites
- Arduino IDE with ESP32 support
- Newest Python Environment
- Localhost (In case of using google authentication)
- Firebase account
- Telegram bot token

### Installation
1. Make sure you have installed all the required prerequisites properly
2. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fish-feeder-system.git
3. Place your files in the localhost folder for making sure your google authentication is working
   ```bash
   cd C:\xampp\htdocs\fish_feed
4. Run the Web application by approaching it by it's web address

## 🔥 Firebase Setup
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  <div>
    <h4>1. Go to Firebase Console</h4> 
    <h4>2. Create a New Project</h4> 
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/edited4.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"> 
  </div>
<div> 
    <h4>4. Create a Web App</h4>
    <h4>5. Create a Real Time Database</h4> 
    <img src="https://fish.programming-pub.store/images/edited/edited3.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  <div>
    <h4>6. Enable Authentication</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/3.PNG" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
  </div>
  <div>
    <h4>7. Add Database Rules</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/edited5.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
</div>

## 🤖 Telegram Setup
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  <div>
    <h4>1. Create a Bot with BotFather</h4>
    <h4>2. Get the API Key</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/tg_edited3.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  <div>
    <h4>3. Configure Python Script</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/tg_edited2.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0;">
  <div>
    <h4>4. Add Firebase Credentials</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/tg_edited1.jpg" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
  <div>
    <h4>5. Run the Bot</h4>
    <img src="https://raw.githubusercontent.com/BawanthaBeliwaththa/AQUA-BITES/refs/heads/main/images/tg2.PNG" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  </div>
</div>

<div align="center">
  <h3>Enjoy your Automated Fish Feeding System! 🎉</h3>
  <p>For any questions or support, please open an issue on GitHub</p>
</div> 
