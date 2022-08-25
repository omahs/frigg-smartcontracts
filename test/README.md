---
### Tests

run hardhat tests with command ```npx hardhat test```

## Unit Test
- isPrimaryMarketActive() on line 34 of ATT.sol

1. when totalSupply() < cap ()
2. when totalSupply() = cap ()
3. when totalSupply() > cap () (this should throw error)

- setBondExpiry() of ATT.sol, on lines 42

1. onlyRole is false
2. if onlyRole is true, isBondExpired = true

- seeBondExpiryStatus() of ATT.sol, on lines 47

1. default value is false
2. once called setBondExpiry, isBondExpired = true

## Integration Tests

- mint() and burn() of ATT.sol, on lines 25 and 29, respectively.

1. check onlyRole
2. check the right amount of tokens minted to the right address

- add() of testRouter.sol, on lines 36 respectively.

1. check onlyRole (DEFAULT_ADMIN_ROLE of router)
2. require condition (DEFAULT_ADMIN_ROLE of outputToken, Frigg-issued tokens)
3. check if tokenData is added data property

- buy(), and sell() of testRouter.sol, on lines 63, and 93, respectively.

1. require inputTokenAmount
2. require IERC1155
3. require isPrimaryMarketActive (for buy) OR require seeBondExpiryStatus() (for sell)
4. transferFrom function, which you need to impersonate an address to ensure approval
5. mint() check the right amount of token is minted OR .burn ()
6. right event is emitted

## Test coverage

run solidity coverage with command ```npx hardhat coverage```

Output: 

File                |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
--------------------|----------|----------|----------|----------|----------------|
 Router/            |      100 |    92.86 |      100 |      100 |                |
  primaryRouter.sol |      100 |    92.86 |      100 |      100 |                |
 Token/             |      100 |      100 |      100 |      100 |                |
  IFrigg.sol        |      100 |      100 |      100 |      100 |                |
 Token/ATT/         |      100 |      100 |      100 |      100 |                |
  ATT.sol           |      100 |      100 |      100 |      100 |                |
 Token/BTT/         |      100 |      100 |      100 |      100 |                |
  BTT.sol           |      100 |      100 |      100 |      100 |                |
|
All files           |      100 |    92.86 |      100 |      100 
