const hre = require("hardhat");

async function main() {

    const BookChain = await hre.ethers.getContractFactory("BookChain");
    const bookChain = await BookChain.deploy();
    
    await bookChain.waitForDeployment();
    
    const contractAddress = await bookChain.getAddress();
    
    console.log("CONTRACT_ADDRESS = '" + contractAddress + "';");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error during deployment:", error);
        process.exit(1);
    });