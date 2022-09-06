# Smart Contracts

## Audits

<TBD>

---

## Router Contract (primaryRouter.sol)

- Implemented for primary market buy/sell between Issuers and Investors

## Router Gater Contract (routerGater.sol)

- Implemented as "Guard" Contract to check if the user is eligible to trade

## Token Contract (e.g ATT.sol)

- Frigg deploys a new ERC20 token for each new issuance

---

## Contract Addresses

| Contract          | Mainnet | Testnet (Goerli) |
| ----------------- | :-----: | ---------------: |
| primaryRouter.sol |         |                  |
| ATT.sol           |         |                  |

---

## Governance

- How is changes to Router / Token contract (e.g., when bond matures) governed (does changes to GitHub repo automatically adjust smart contract? Does it need to be signed by 2 parties / wallets? etc..)
- Changes to Router redeployed
- \_grantrole at token contracts

---

## Development

### Deployment Sequence:

1. **routerGater.sol**

- address \_multisig = Provided Address will be granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
- address \_goldfinchUIDAddress = Contract Address of GoldfinchUIDContract (e.g. Goerli: `0x10e55306017e67e395Ee2fAC36e9DA82c04A556D`, Mainnet: `0xba0439088dc1e75f58e0a7c107627942c15cbb41`)
- address \_quadrataAddress = Contract Address of QuadrataUIDContract (e.g. Goerli: `0xdeB66c6744097d7172539BB7c7FC1e255d1135cD`, Mainnet: `0x7907bD4Be498cC9a7E2CF1a31dEeFCD8B132bca9`)

---

2. **primaryRouter.sol**

- address \_multisig = Provided Address will be granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
- address \_routerGater = Contract Address of routerGater.sol

---

3. **ATT.sol (or any other Issuance token contract)**

- address \_multisig = Provided Address will be granted `DEFAULT_ADMIN_ROLE` **(This account can change contract's state!)**
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
