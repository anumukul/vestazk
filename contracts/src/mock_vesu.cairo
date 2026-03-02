use starknet::ContractAddress;
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess,
};

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
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess,
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
            
            amount
        }

        fn borrow(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current_debt = self.debt.read((caller, asset));
            self.debt.write((caller, asset), current_debt + amount);
            
            let total = self.total_borrowed.read(asset);
            self.total_borrowed.write(asset, total + amount);
            
            amount
        }

        fn repay(ref self: ContractState, asset: ContractAddress, amount: u256) -> u256 {
            let caller = get_caller_address();
            let current_debt = self.debt.read((caller, asset));
            let repay_amount = if current_debt >= amount { amount } else { current_debt };
            
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
