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
