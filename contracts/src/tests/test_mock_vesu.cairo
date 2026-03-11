#[cfg(test)]
mod tests {
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
    use starknet::ContractAddress;
    use core::traits::Into;
    use vesu_vault::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use vesu_vault::mock_vesu::{IVesuPoolDispatcher, IVesuPoolDispatcherTrait};

    fn deploy_pool() -> IVesuPoolDispatcher {
        let pool_class = declare("MockVesuPool").unwrap();
        let calldata: Array<felt252> = ArrayTrait::new();
        let (addr, _) = pool_class.contract_class().deploy(@calldata).unwrap();
        IVesuPoolDispatcher { contract_address: addr }
    }

    fn deploy_token(
        name: felt252,
        symbol: felt252,
        decimals: u8,
        initial_supply: u256,
        recipient: ContractAddress
    ) -> IERC20Dispatcher {
        let token_class = declare("ERC20").unwrap();
        let mut calldata: Array<felt252> = ArrayTrait::new();
        calldata.append(name);
        calldata.append(symbol);
        calldata.append(decimals.into());
        calldata.append(initial_supply.low.into());
        calldata.append(initial_supply.high.into());
        calldata.append(recipient.into());
        let (addr, _) = token_class.contract_class().deploy(@calldata).unwrap();
        IERC20Dispatcher { contract_address: addr }
    }

    #[test]
    fn test_supply_moves_assets_into_pool() {
        let supplier = starknet::contract_address_const::<0x123>();
        let initial_supply = u256 { low: 1_000, high: 0 };
        let supply_amount = u256 { low: 250, high: 0 };

        let token = deploy_token('MockWBTC', 'mWBTC', 8, initial_supply, supplier);
        let pool = deploy_pool();

        start_cheat_caller_address(token.contract_address, supplier);
        token.approve(pool.contract_address, supply_amount);
        stop_cheat_caller_address(token.contract_address);

        start_cheat_caller_address(pool.contract_address, supplier);
        let supplied = pool.supply(token.contract_address, supply_amount);
        stop_cheat_caller_address(pool.contract_address);

        assert(supplied == supply_amount, 'Supply result mismatch');
        assert(token.balance_of(supplier) == u256 { low: 750, high: 0 }, 'Supplier balance mismatch');
        assert(token.balance_of(pool.contract_address) == supply_amount, 'Pool balance mismatch');
        assert(pool.get_user_collateral(supplier, token.contract_address) == supply_amount, 'Collateral mismatch');
    }

    #[test]
    fn test_borrow_mints_assets_to_borrower() {
        let borrower = starknet::contract_address_const::<0x456>();
        let borrow_amount = u256 { low: 500, high: 0 };
        let token = deploy_token(
            'MockUSDC',
            'mUSDC',
            6,
            u256 { low: 0, high: 0 },
            borrower
        );
        let pool = deploy_pool();

        start_cheat_caller_address(pool.contract_address, borrower);
        let borrowed = pool.borrow(token.contract_address, borrow_amount);
        stop_cheat_caller_address(pool.contract_address);

        assert(borrowed == borrow_amount, 'Borrow result mismatch');
        assert(token.balance_of(borrower) == borrow_amount, 'Borrower balance mismatch');
        assert(pool.get_user_debt(borrower, token.contract_address) == borrow_amount, 'Debt mismatch');
    }
}
