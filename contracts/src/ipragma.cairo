#[derive(Drop, Clone, Serde, PartialEq)]
pub struct PragmaPricesResponse {
    pub price: u128,
    pub decimals: u32,
    pub timestamp: u64,
    pub source: felt252,
}

#[starknet::interface]
pub trait IPragmaOracle<TContractState> {
    fn get_spot_price(self: @TContractState, pair_id: felt252) -> PragmaPricesResponse;
    fn get_data_median(self: @TContractState, pair_id: felt252) -> PragmaPricesResponse;
    fn get_latest_timestamp(self: @TContractState, pair_id: felt252) -> u64;
}
