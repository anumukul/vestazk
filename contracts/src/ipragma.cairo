#[starknet::interface]
pub trait IPragmaOracle<TContractState> {
    fn get_spot_price(self: @TContractState, pair_id: felt252) -> u128;
    fn get_data_median(self: @TContractState, pair_id: felt252) -> (u128, u128, u128, felt252);
    fn get_latest_timestamp(self: @TContractState, pair_id: felt252) -> u64;
}
