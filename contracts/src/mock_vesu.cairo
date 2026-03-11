use starknet::ContractAddress;

#[starknet::interface]
pub trait IVesuPool<TContractState> {
    fn supply(ref self: TContractState, asset: ContractAddress, amount: u256) -> u256;
    fn withdraw(ref self: TContractState, asset: ContractAddress, amount: u256) -> u256;
    fn borrow(ref self: TContractState, asset: ContractAddress, amount: u256) -> u256;
    fn repay(ref self: TContractState, asset: ContractAddress, amount: u256) -> u256;
    fn get_user_collateral(self: @TContractState, user: ContractAddress, asset: ContractAddress) -> u256;
    fn get_user_debt(self: @TContractState, user: ContractAddress, asset: ContractAddress) -> u256;
    fn get_supply_balance(self: @TContractState, user: ContractAddress, asset: ContractAddress) -> u256;
    fn get_borrow_balance(self: @TContractState, user: ContractAddress, asset: ContractAddress) -> u256;
}

#[starknet::contract]
pub mod MockVesuPool {
    use super::{IVesuPool, ContractAddress};
    use crate::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess,
    };

    #[storage]
    struct Storage {
        collateral: Map<(ContractAddress, ContractAddress), u256>,
        debt: Map<(ContractAddress, ContractAddress), u256>,
        total_supply: Map<ContractAddress, u256>,
        total_borrowed: Map<ContractAddress, u256>,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl VesuPoolImpl of IVesuPool<ContractState> {
        fn supply(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current = self.collateral.read((caller, asset));
            let asset_token = IERC20Dispatcher { contract_address: asset };
            let pool_address = get_contract_address();
            let transferred = asset_token.transfer_from(caller, pool_address, amount);
            assert(transferred, 'Supply transfer failed');

            self.collateral.write((caller, asset), current + amount);
            
            let total = self.total_supply.read(asset);
            self.total_supply.write(asset, total + amount);
            
            amount
        }

        fn withdraw(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current = self.collateral.read((caller, asset));
            assert(current >= amount, 'Insufficient collateral');
            
            self.collateral.write((caller, asset), current - amount);
            
            let total = self.total_supply.read(asset);
            self.total_supply.write(asset, total - amount);

            let asset_token = IERC20Dispatcher { contract_address: asset };
            let transferred = asset_token.transfer(caller, amount);
            assert(transferred, 'Withdraw transfer failed');
            
            amount
        }

        fn borrow(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current_debt = self.debt.read((caller, asset));
            self.debt.write((caller, asset), current_debt + amount);
            
            let total = self.total_borrowed.read(asset);
            self.total_borrowed.write(asset, total + amount);

            // Mint mock liquidity directly to the borrower so the vault can forward it.
            let asset_token = IERC20Dispatcher { contract_address: asset };
            asset_token.mint(caller, amount);
            
            amount
        }

        fn repay(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current_debt = self.debt.read((caller, asset));
            let repay_amount = if current_debt >= amount { amount } else { current_debt };

            let asset_token = IERC20Dispatcher { contract_address: asset };
            let pool_address = get_contract_address();
            let transferred = asset_token.transfer_from(caller, pool_address, repay_amount);
            assert(transferred, 'Repay transfer failed');
            
            self.debt.write((caller, asset), current_debt - repay_amount);
            
            let total = self.total_borrowed.read(asset);
            self.total_borrowed.write(asset, total - repay_amount);
            
            repay_amount
        }

        fn get_user_collateral(self: @ContractState, user: ContractAddress, asset: ContractAddress) -> u256 {
            self.collateral.read((user, asset))
        }

        fn get_user_debt(self: @ContractState, user: ContractAddress, asset: ContractAddress) -> u256 {
            self.debt.read((user, asset))
        }

        fn get_supply_balance(self: @ContractState, user: ContractAddress, asset: ContractAddress) -> u256 {
            self.collateral.read((user, asset))
        }

        fn get_borrow_balance(self: @ContractState, user: ContractAddress, asset: ContractAddress) -> u256 {
            self.debt.read((user, asset))
        }
    }
}
