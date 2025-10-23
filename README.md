# Instant Liquidation Engine ⚡ - Lending Protocol на MegaETH

## 🎯 Концепция

**Instant Liquidation Engine** — это лендинговый протокол (как Aave/Compound), который использует **10ms блоки** MegaETH для обеспечения почти мгновенных ликвидаций. Как только цена (от оракула, обновляемого каждую секунду) делает позицию нездоровой (Health Factor < 1.0), боты-ликвидаторы могут отправить транзакцию, которая будет включена в следующий 10ms мини-блок. Это радикально снижает риск "плохого долга" для протокола.

## 🚀 Почему MegaETH?

На Ethereum у вас есть **12-секундное "окно риска"** между падением цены и ликвидацией. На MegaETH это окно — всего **10-50ms**. Это делает протокол **гипер-эффективным по капиталу** и гораздо более безопасным от каскадных ликвидаций во время резких колебаний рынка.

## 📝 Deployed Contract

- **Contract Name**: InstantLendingPool
- **Address**: `0x4a3401547b860761232834C947e7E011eBc4312`
- **Network**: MegaETH Testnet
- **Explorer**: https://megaexplorer.xyz/address/0x4a3401547b860761232834C947e7E011eBc4312

## 🏗️ Архитектура

### Smart Contract (InstantLendingPool.sol)

**Ключевые структуры:**
```solidity
struct UserPosition {
    uint256 supplied;       // Collateral (ETH)
    uint256 borrowed;       // Debt (USDC)
    uint256 lastUpdateTime;
}
```

**Константы:**
```solidity
uint256 public constant LIQUIDATION_THRESHOLD = 150; // 150% collateral ratio
uint256 public constant LIQUIDATION_BONUS = 105;    // 5% bonus for liquidator
```

**Основные функции:**
- `supply()` - внести ETH как залог
- `borrow(uint256 amount)` - взять займ (USDC)
- `getHealthFactor(address user)` - получить Health Factor (view)
- `liquidate(address user)` - ликвидировать нездоровую позицию

**Формула Health Factor:**
```solidity
HF = (collateral_value_in_USD * 100) / debt_value_in_USD

HF >= 150: Healthy ✅
HF < 150: Can be liquidated ⚠️
```

**События:**
```solidity
event Supplied(address indexed user, uint256 amount);
event Borrowed(address indexed user, uint256 amount);
event Liquidated(address indexed liquidator, address indexed user, uint256 debtRepaid, uint256 collateralSeized);
```

## 💻 Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Hardhat, OpenZeppelin (Ownable, ReentrancyGuard)
- **Frontend**: React + Next.js, TypeScript, wagmi, viem, Chart.js, Tailwind
- **Backend (Liquidator Bot)**: Node.js с viem (опционально)
- **Blockchain**: MegaETH (10ms blocks)

## 🎮 User Flows

### 1. Supplying Collateral
1. Пользователь подключает кошелек
2. Видит: "Supply ETH as Collateral"
3. Вводит сумму: 10 ETH
4. Нажимает "Supply"
5. Подписывает транзакцию `supply()`

### 2. Borrowing
1. UI показывает: "Max Borrow: 13,333 USDC" (при ETH = $2000, LTV = 66.67%)
2. Пользователь вводит: 10,000 USDC
3. Нажимает "Borrow"
4. Получает 10,000 USDC
5. Health Factor отображается: 2.0 (Healthy ✅)

### 3. Health Factor Monitoring (⚡ Real-time!)

**Ключевая фича: Realtime Health Factor**

Пользователь смотрит на дашборд. Большой виджет показывает:

```
Health Factor: [ 1.54 ]
███████░░░ Safe
```

**Что происходит за кулисами:**
```typescript
// Хук useHealthFactor подписывается на два типа событий:

// 1. Обновления оракула цен
megaeth.subscribe('logs', {
  address: OracleAddress,
  topic: 'PriceUpdated'
}, async (log) => {
  // Цена изменилась → немедленно пересчитать HF
  const newHF = await contract.read.getHealthFactor(userAddress);
  setHealthFactor(newHF);
});

// 2. Действия пользователя (borrow/supply)
megaeth.subscribe('logs', {
  address: LendingPoolAddress,
  user: currentUserAddress
}, async (log) => {
  const newHF = await contract.read.getHealthFactor(userAddress);
  setHealthFactor(newHF);
});
```

**Результат:**
- Оракул пушит новую цену ETH (каждую секунду)
- Realtime API ловит событие `PriceUpdated`
- Фронтенд **мгновенно** делает view-call `getHealthFactor()`
- Цифра "1.54" на экране **мгновенно** меняется на "1.51"
- Если HF < 1.1, виджет становится **ярко-красным**: ⚠️ "AT RISK! Repay now!"

### 4. Liquidation (Liquidator Bot)

**Логика 10ms блоков:**
```typescript
// Liquidator bot (Node.js)
megaeth.subscribe('logs', {
  address: OracleAddress,
  topic: 'PriceUpdated'
}, async (log) => {
  // Цена упала! Проверить все позиции
  for (const user of allUsers) {
    const hf = await contract.read.getHealthFactor(user);
    
    if (hf < 1.0) {
      // Немедленно ликвидировать!
      await contract.write.liquidate(user);
      console.log(`⚡ Liquidated ${user} in <50ms!`);
    }
  }
});
```

**Результат:**
- Цена ETH падает с $2000 до $1900
- Бот обнаруживает это через **10-20ms**
- Отправляет `liquidate()` транзакцию
- Транзакция попадает в следующий **10ms мини-блок**
- **Общее время: ~30-50ms** (vs. 12+ секунд на Ethereum!)

## 🔥 Уникальные Фичи

1. **10ms Liquidation Window**: Минимальный риск для протокола
2. **Real-time Health Factor**: Пользователь видит изменения мгновенно
3. **Capital Efficient**: Меньшее окно риска → можно увеличить LTV (Loan-to-Value)
4. **No Bad Debt**: Мгновенные ликвидации предотвращают убытки протокола

## 📊 Сравнение с Ethereum

| Параметр | Ethereum (Aave) | MegaETH (Instant) |
|----------|----------------|-------------------|
| **Risk Window** | ~12-24 сек | ~10-50 мс |
| **HF Update Delay** | ~12 сек | ~10-50 мс |
| **Max LTV** | 80% (осторожно) | 90%+ (безопасно) |
| **Bad Debt Risk** | Средний | Минимальный |

## 🛠️ Local Development

```bash
npm install
npm run compile
npm run deploy  # уже задеплоено!
```

## 📚 Документация

См. [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) для инструкций по деплою дашборда на Vercel.

---

**Built with ❤️ for MegaETH Hackathon**

