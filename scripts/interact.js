const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  try {
    console.log("=== Начало взаимодействия с контрактом CFITTOKEN ===\n");

    const [owner, addr1, addr2] = await ethers.getSigners();
    console.log(`Владелец (owner): ${owner.address}`);
    console.log(`Адрес 1 (addr1): ${addr1.address}`);
    console.log(`Адрес 2 (addr2): ${addr2.address}\n`);

    const contractAddressData = fs.readFileSync("contract-address.json");
    const { CFITTOKEN: contractAddress } = JSON.parse(contractAddressData);
    console.log(`Подключение к контракту CFITTOKEN по адресу: ${contractAddress}\n`);

    const cfiToken = await ethers.getContractAt("CFITTOKEN", contractAddress);
    console.log("Экземпляр контракта успешно получен.\n");

    console.log("Получение владельца контракта...");
    const contractOwner = await cfiToken.owner();
    console.log(`Владелец контракта: ${contractOwner}\n`);

    console.log("Проверка балансов аккаунтов...");
    const ownerBalance = await cfiToken.balanceOf(owner.address);
    const addr1Balance = await cfiToken.balanceOf(addr1.address);
    const addr2Balance = await cfiToken.balanceOf(addr2.address);
    console.log(`Баланс владельца: ${ethers.formatUnits(ownerBalance, 18)} CFI`);
    console.log(`Баланс addr1: ${ethers.formatUnits(addr1Balance, 18)} CFI`);
    console.log(`Баланс addr2: ${ethers.formatUnits(addr2Balance, 18)} CFI\n`);

    console.log(`Перевод 100 CFI от владельца (${owner.address}) к addr1 (${addr1.address})`);
    const transferTx = await cfiToken.transfer(addr1.address, ethers.parseUnits("100", 18));
    await transferTx.wait();
    console.log("Перевод завершен.\n");

    console.log(`Перевод 1000 CFI от владельца (${owner.address}) к контракту (${contractAddress}) для покрытия наград`);
    const fundTx = await cfiToken.transfer(contractAddress, ethers.parseUnits("1000", 18));
    await fundTx.wait();
    console.log("Перевод наград завершен.\n");

    console.log("Проверка балансов после перевода...");
    const ownerBalanceAfter = await cfiToken.balanceOf(owner.address);
    const addr1BalanceAfter = await cfiToken.balanceOf(addr1.address);
    const contractBalance = await cfiToken.balanceOf(contractAddress);
    console.log(`Баланс владельца после перевода: ${ethers.formatUnits(ownerBalanceAfter, 18)} CFI`);
    console.log(`Баланс addr1 после перевода: ${ethers.formatUnits(addr1BalanceAfter, 18)} CFI`);
    console.log(`Баланс контракта после перевода: ${ethers.formatUnits(contractBalance, 18)} CFI\n`);

    console.log(`addr1 (${addr1.address}) стейкает 50 CFI на 30 дней`);
    const stakeTx = await cfiToken.connect(addr1).stake(ethers.parseUnits("50", 18), 30 * 24 * 60 * 60);
    await stakeTx.wait();
    console.log("Стейкинг завершен.\n");

    const stakeCount = await cfiToken.getStakeCount(addr1.address);
    console.log(`Количество стейков у addr1: ${stakeCount}\n`);

    if (stakeCount > 0) {
      const stake = await cfiToken.getStake(addr1.address, 0);
      console.log(`Информация о стейке 0 у addr1:`);
      console.log(`  Сумма: ${ethers.formatUnits(stake.amount, 18)} CFI`);
      console.log(`  Время стейка: ${new Date(Number(stake.timestamp) * 1000).toLocaleString()}`);
      console.log(`  Длительность блокировки: ${stake.lockDuration} секунд\n`);
    }

    console.log("Увеличиваем время на 30 дней для тестирования вывода стейка...");
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);
    console.log("Время увеличено.\n");

    console.log(`addr1 (${addr1.address}) выводит стейк 0`);
    const withdrawTx = await cfiToken.connect(addr1).withdrawStake(0);
    await withdrawTx.wait();
    console.log("Вывод стейка завершен.\n");

    console.log("Проверка балансов после вывода стейка...");
    const ownerBalanceFinal = await cfiToken.balanceOf(owner.address);
    const addr1BalanceFinal = await cfiToken.balanceOf(addr1.address);
    const contractBalanceFinal = await cfiToken.balanceOf(contractAddress);
    console.log(`Баланс владельца после вывода стейка: ${ethers.formatUnits(ownerBalanceFinal, 18)} CFI`);
    console.log(`Баланс addr1 после вывода стейка: ${ethers.formatUnits(addr1BalanceFinal, 18)} CFI`);
    console.log(`Баланс контракта после вывода стейка: ${ethers.formatUnits(contractBalanceFinal, 18)} CFI\n`);

    const stakeCountFinal = await cfiToken.getStakeCount(addr1.address);
    console.log(`Количество стейков у addr1 после вывода: ${stakeCountFinal}\n`);

    console.log("=== Взаимодействие завершено ===");
  } catch (error) {
    console.error("Ошибка при взаимодействии с контрактом:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Не удалось выполнить скрипт:", error);
    process.exit(1);
  });
