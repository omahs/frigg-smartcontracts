# Smart Contracts

### Audits

<TBD>

---

### Router Contract

- Implemented for primary market buy/sell between Issuers and Investors

### Token Contract

- Frigg deploys a new ERC20 token for each new issuance

---

### Contract Addresses

| Contract          | Mainnet | Testnet (Goerli) |
| ----------------- | :-----: | ---------------: |
| primaryRouter.sol |         |                  |
| ATT.sol           |         |                  |

---

### Governance

- How is changes to Router / Token contract (e.g., when bond matures) governed (does changes to GitHub repo automatically adjust smart contract? Does it need to be signed by 2 parties / wallets? etc..)
- Chnanges to Router redeployed
- \_grantrole at token contracts

---

### Development

- Deploy new contracts: `npx hardhat run scripts/deploy.ts --network <network>`
- Verify deployed Contract: e.g: `npx hardhat (hh) verify --contract "contracts/contract.sol:contract" --network <network> <address> <...args>`

---

### Tests

1. run hardhat tests with command `npx hardhat test`
2. documentation for tests are available in `/test/README.md`
