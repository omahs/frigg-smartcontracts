import { ethers } from "hardhat";
import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);

async function updateDbRecord(id: string, contractAddress: string) {
  try {
    await client.connect();

    await client.db("test").collection("bonds").updateOne(
      { _id: new ObjectId(id) },
      {
        $set:
        {
          contractAddress
        }
      }
    )
  } catch (e) {
    console.error("Error: " + e)
  } finally {
    await client.close();
  }
}

async function main() {
  const tokenContract = await ethers.getContractFactory("FriggToken");

  const ID = process.env.ID!;
  const TOKEN_MULTISIG = process.env.TOKEN_MULTISIG!;
  const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS!;
  const NAME = process.env.NAME!;
  const SYMBOL = process.env.SYMBOL!;
  const AMOUNT = process.env.AMOUNT!;
  const TERMS = process.env.TERMS!;

  const friggToken = await tokenContract.deploy(
    TOKEN_MULTISIG,
    ROUTER_ADDRESS,
    NAME,
    SYMBOL,
    AMOUNT,
    TERMS
  );

  await friggToken.deployed();

  console.log(`Frigg Token deployed: ${process.env.ETHERSCAN_URL}address/${friggToken.address}`);

  await updateDbRecord(ID, friggToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
