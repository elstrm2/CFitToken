const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const CFITTOKEN = await ethers.getContractFactory("CFITTOKEN");

    const initialSupply = ethers.parseUnits("2000", 18);

    console.log("Deploying contract...");
    const cfiToken = await CFITTOKEN.deploy(initialSupply);

    await cfiToken.waitForDeployment();
    console.log("Contract deployed!");

    if (cfiToken.target) {
      console.log("CFITTOKEN contract deployed to:", cfiToken.target);
      fs.writeFileSync("contract-address.json", JSON.stringify({ CFITTOKEN: cfiToken.target }, null, 2));
    } else {
      console.error("Contract address not found!");
    }

    console.log("Deployed Contract Object:", cfiToken);
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
