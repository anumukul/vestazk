use core::array::{ArrayTrait, Span};
use core::integer::u256;
use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
}

#[starknet::interface]
pub trait IVesuVault<TContractState> {
    fn deposit(ref self: TContractState, amount: u256) -> felt252;
    fn withdraw(ref self: TContractState, commitment: felt252, amount: u256) -> bool;
    fn get_merkle_root(self: @TContractState) -> felt252;
    fn get_commitment_count(self: @TContractState) -> u64;
    fn is_nullifier_used(self: @TContractState, nullifier: felt252) -> bool;
    fn get_total_deposited(self: @TContractState) -> u256;
    fn get_user_deposit(self: @TContractState, commitment: felt252) -> (u256, felt252);
    fn get_commitment(self: @TContractState, user: ContractAddress) -> felt252;
}

#[starknet::contract]
pub mod VesuVault {
    use super::{ArrayTrait, ContractAddress, IERC20Dispatcher, IERC20DispatcherTrait, IVesuVault, u256};
    use core::poseidon::poseidon_hash_span;
    use starknet::get_caller_address;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        merkle_root: felt252,
        total_deposited: u256,
        commitment_count: u64,
        commitments: Map<felt252, (u256, felt252)>,
        user_commitments: Map<ContractAddress, felt252>,
        nullifiers: Map<felt252, bool>,
        wbtc_token: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposited {
        #[key]
        user: ContractAddress,
        amount: u256,
        commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdrawn {
        #[key]
        user: ContractAddress,
        amount: u256,
        commitment: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, wbtc_token: ContractAddress) {
        self.wbtc_token.write(wbtc_token);
        self.merkle_root.write(0);
        self.commitment_count.write(0);
        self.total_deposited.write(u256 { low: 0, high: 0 });
    }

    #[abi(embed_v0)]
    impl VesuVaultImpl of IVesuVault<ContractState> {
        fn deposit(ref self: ContractState, amount: u256) -> felt252 {
            let caller = get_caller_address();
            
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let vault_address = starknet::get_contract_address();
            
            let transferred = wbtc.transfer_from(caller, vault_address, amount);
            assert(transferred == true, 'WBTC transfer failed');

            let salt = self.generate_salt(caller, amount);
            let commitment = self.compute_commitment(caller, amount, salt);

            let current_count = self.commitment_count.read();
            self.commitments.write(commitment, (amount, salt));
            self.user_commitments.write(caller, commitment);
            self.commitment_count.write(current_count + 1);
            self.total_deposited.write(self.total_deposited.read() + amount);

            let new_root = self.update_merkle_root(commitment, current_count);
            self.merkle_root.write(new_root);

            self.emit(Event::Deposited(Deposited {
                user: caller,
                amount,
                commitment,
            }));

            commitment
        }

        fn withdraw(ref self: ContractState, commitment: felt252, amount: u256) -> bool {
            let caller = get_caller_address();
            assert(!self.is_nullifier_used(commitment), 'Commitment already used');

            let (stored_amount, _) = self.commitments.read(commitment);
            assert(stored_amount == amount, 'Amount mismatch');

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            wbtc.transfer(caller, amount);

            self.nullifiers.write(commitment, true);
            self.total_deposited.write(self.total_deposited.read() - amount);

            self.emit(Event::Withdrawn(Withdrawn {
                user: caller,
                amount,
                commitment,
            }));

            true
        }

        fn get_merkle_root(self: @ContractState) -> felt252 {
            self.merkle_root.read()
        }

        fn get_commitment_count(self: @ContractState) -> u64 {
            self.commitment_count.read()
        }

        fn is_nullifier_used(self: @ContractState, nullifier: felt252) -> bool {
            self.nullifiers.read(nullifier)
        }

        fn get_total_deposited(self: @ContractState) -> u256 {
            self.total_deposited.read()
        }

        fn get_user_deposit(self: @ContractState, commitment: felt252) -> (u256, felt252) {
            self.commitments.read(commitment)
        }

        fn get_commitment(self: @ContractState, user: ContractAddress) -> felt252 {
            self.user_commitments.read(user)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn compute_commitment(
            self: @ContractState,
            owner: ContractAddress,
            amount: u256,
            salt: felt252,
        ) -> felt252 {
            let mut inputs: Array<felt252> = ArrayTrait::new();
            inputs.append(owner.into());
            inputs.append(amount.low.into());
            inputs.append(amount.high.into());
            inputs.append(salt);
            poseidon_hash_span(inputs.span())
        }

        fn generate_salt(self: @ContractState, owner: ContractAddress, amount: u256) -> felt252 {
            let count = self.commitment_count.read();
            let mut inputs: Array<felt252> = ArrayTrait::new();
            inputs.append(owner.into());
            inputs.append(amount.low.into());
            inputs.append(amount.high.into());
            inputs.append(count.into());
            poseidon_hash_span(inputs.span())
        }

        fn update_merkle_root(
            self: @ContractState,
            commitment: felt252,
            index: u64,
        ) -> felt252 {
            let current_root = self.merkle_root.read();
            if current_root == 0 {
                return commitment;
            }
            let mut inputs: Array<felt252> = ArrayTrait::new();
            inputs.append(current_root);
            inputs.append(commitment);
            poseidon_hash_span(inputs.span())
        }
    }
}
