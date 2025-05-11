# Pefin: Modern Personal Finance Management 💸

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React Version](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6%2B-B73BFE)](https://vitejs.dev/)
[![Yarn](https://img.shields.io/badge/Yarn-1.22%2B-2C8EBB)](https://yarnpkg.com/)

**Pefin** is a modern web-based personal finance tracker that helps you manage expenses, analyze spending patterns, and achieve financial goals. Built with React and Vite for blazing-fast performance, this app puts your financial data visualization front-and-center.

---

## 🚀 Features

- **Interactive Dashboard**: Real-time expense tracking with visual charts
- **Transaction History**: Inspect transaction history with a monthly view
- **Data Synchronization**: Data synchronized in your google account
- **Responsive Design**: Works flawlessly on desktop and mobile

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Yarn 1.22+

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/dghilardi/pefin.git
   cd pefin
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Configure environment variables** (optional):
   - Create `.env` file using `.env.example` template
   - Customize settings like default currency or theme

4. **Start the development server**:
   ```bash
   yarn dev
   ```
   App will open at `http://localhost:5173`

---

## 🛠️ Building & Deployment

**Production Build**:
```bash
yarn build
```

**Preview Production Build**:
```bash
yarn preview
```

**Lint Code**:
```bash
yarn lint
```

---

## 📈 Key Components

- **Insert Transaction** Insert a new transaction
- **Monhly Report**: Overview of monthly expenses
- **Insights**: Full year view to better compare months

---

## 🧑💻 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **State Management**: React Context API & Jotai
- **Charts**: Mui Charts
- **Styling**: Mui

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch:
   ```bash
   git checkout -b feat/amazing-feature
   ```
3. Install dependencies and ensure tests pass:
   ```bash
   yarn install
   yarn test
   ```
4. Commit your changes:
   ```bash
   git commit
   ```
5. Push to the branch:
   ```bash
   git push origin feat/amazing-feature
   ```
6. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🌐 Live Demo

Check out our hosted version: [https://pefin.d71.dev](https://pefin.d71.dev)

---

## 🙏 Acknowledgments

- React community for awesome ecosystem
- Vite team for fast development experience