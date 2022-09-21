# Smart Contracts

This documentation is meant to be private

## Audits

Audited by Axelra Labs. Report available here (https://friggeco-my.sharepoint.com/:b:/g/personal/philip_berntsen_frigg_eco/Eagz5LGhOsFPrF7VlTujf1oBmhB6YAnOq30tpLKa3RJsAw?e=82q4gL)

---

## Router Contract (primaryRouter.sol)

- Implemented for primary market buy/sell between Issuers and Investors

## Router Gater Contract (routerGater.sol)

- Implemented as "Guard" Contract to check if the user is eligible to trade

## Token Contract (e.g ATT.sol)

- Frigg deploys a new ERC20 token for each new issuance

---

## Contract Addresses

| Contract          |                  Mainnet                   |                           Testnet (Goerli) |
| ----------------- | :----------------------------------------: | -----------------------------------------: |
| routerGater.sol   | 0xBCc3dB2316d8793f84c822953B622Bd292424C68 | 0x64a75f145e859Af7399f188Cf674afd7416D2b46 |
| primaryRouter.sol | 0x96418DF8B474e90E49183CC23fa41e4aD8B0ddbE | 0x549eC5e96B71cBE1a837D0F1289462757e1d83E9 |
| ATT.sol           | 0x90D53b872ce6421122B41a290aCdD22a5eD931bd | 0x25a1dAd9d882c335D100f8E0cb20701376Eeb658 |

---

## Governance

Logic is available on Microsoft Whiteboard here (https://friggeco-my.sharepoint.com/:wb:/g/personal/jack_chong_frigg_eco/EXK9aFawTcVDmgGW3uFAJwUBGNE7OXfZDIkfbzSOFHMgAg?e=g8p9UL)

![Screenshot 2022-09-16 at 2 08 34 PM](https://user-images.githubusercontent.com/62898158/190704331-e08603ae-6a42-4c25-9773-289a3e737c7b.png)

---

## Development

### Deployment Sequence:

1. **routerGater.sol**

- address \_multisig = Gnosis Safe Frigg.eco is granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
- address \_goldfinchUIDAddress = Contract Address of GoldfinchUIDContract (e.g. Goerli deployed by ourselves as a standard ERC1155: `0x10e55306017e67e395Ee2fAC36e9DA82c04A556D`, Mainnet: `0xba0439088dc1e75f58e0a7c107627942c15cbb41`)
  Reference: https://docs.goldfinch.finance/goldfinch/unique-identity-uid/for-developers
- address \_quadrataAddress = Contract Address of QuadReader (e.g. Goerli: `0x5C6b81212c0A654B6e247F8DEfeC9a95c63EF954`, Mainnet: `0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da`)
  Reference: https://docs.quadrata.com/integration/additional-information/smart-contracts

---

2. **primaryRouter.sol**

- address \_multisig = Gnosis Safe Frigg.eco is granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
- address \_routerGater = Contract Address of routerGater.sol

---

3. **ATT.sol (or any other Issuance token contract)**

- address \_multisig = Gnosis Safe Agatobwe.eco will be granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
- address \_router = Router Contract Address will be granted `ROUTER_ROLE` **(Only the router is allowed to mint / burn tokens!)**

---

How to deploy the contracts?

- <input type="checkbox"> Deploy new contracts: `npx hardhat run scripts/deploy.ts --network <network>`

  - All contracts (routerGater, primaryRouter & ATT) get compiled
  - All contracts (routerGater, primaryRouter & ATT) get deployed to goerli
  - (In the current `deploy.ts`, the token automatically gets added via `add()` to the router)

- <input type="checkbox"> Verify deployed Contract: e.g: `npx hardhat (hh) verify --contract "contracts/contract.sol:contract" --network <network> <address> <...args>`

- <input type="checkbox"> Add new token to primaryRouter
  - Call function `add()` of router contract with params: <br>
    outputTokenAddress: `Contract Address of Token (e.g. ATT)` <br>
    uIdContract: `UID Contract Address (Choose correct contract on testnet & mainnet!)` <br>
    issuer: `Account of Issues (Gnosis Safe)` <br>
    issuancePrice: Initial Price `1000000000000` (price = (1 \* 10^18) / (USD \* 10^6) e.g., 100USD = 10^18/10^8) <br>
    expiryPrice: Expiry Price `666666666666` (price = (1/(expirydigit) \* 10^18) / (USD \* 10^6) e.g., 200USD = 10^18/20^8) <br>
    issuanceTokenAddress: `USDC Contract Address (Choose correct contract on testnet & mainnet!)` <br>

**New Contracts launched! 🚀**

---

**If you want to use the contracts on the microsite, follow these steps:**

- <input type="checkbox"> Update Frigg's Uniswap Widget: https://github.com/FriggGroup/uniswap-widgets

  - **package.json**: Increment Version Number
  - **src/constants/addresses.ts**: Replace old router addresses
  - **src/cosmos/Swap.fixture.tsx Line 38 & 80**: Replace old token address
  - **{abi}.json**: Check all abi files if they're up-to-date
  - Run `yarn build`
  - Run `yarn release`

- <input type="checkbox"> Update Microsite: https://github.com/FriggGroup/friggdemo
  - Delete node_modules
  - **package.json: @friggeco/uniswap-widgets**: Add new version & `yarn install`
  - **packages/shared/constants/addresses.ts**: Replace old router & token addresses
  - **{abi}.json**: Check all abi files if they're up-to-date
  - Test the microsite `yarn dev:microsite` <br>

**New Contracts launched on Microsite! 🚀**

---

## Tests

1. run hardhat tests with command `npx hardhat test`
2. documentation for tests are available in `/test/README.md`
