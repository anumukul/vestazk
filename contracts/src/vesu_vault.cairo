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
    fn borrow(
        ref self: TContractState,
        proof: Span<felt252>,
        public_inputs: BorrowPublicInputs,
        recipient: ContractAddress
    ) -> bool;
    fn emergency_exit(ref self: TContractState, proof: Span<felt252>, public_inputs: ExitPublicInputs) -> bool;
    fn get_merkle_root(self: @TContractState) -> felt252;
    fn get_commitment_count(self: @TContractState) -> u64;
    fn is_nullifier_used(self: @TContractState, nullifier: felt252) -> bool;
    fn get_total_deposited(self: @TContractState) -> u256;
    fn get_total_borrowed(self: @TContractState) -> u256;
    fn get_user_deposit(self: @TContractState, commitment: felt252) -> (u256, felt252);
    fn get_commitment(self: @TContractState, user: ContractAddress) -> felt252;
    fn get_aggregate_health_factor(self: @TContractState) -> (u256, u256, u256);
    fn get_paused(self: @TContractState) -> bool;
    fn get_min_health_factor(self: @TContractState) -> u256;
    fn get_buffer_percentage(self: @TContractState) -> u256;
    fn get_btc_price(self: @TContractState) -> u256;
    fn get_usdc_price(self: @TContractState) -> u256;
    fn pause(ref self: TContractState) -> bool;
    fn unpause(ref self: TContractState) -> bool;
    fn set_verifier(ref self: TContractState, verifier: ContractAddress) -> bool;
    fn set_oracle(ref self: TContractState, oracle: ContractAddress) -> bool;
}

#[derive(Drop, Serde, Clone)]
pub struct BorrowPublicInputs {
    merkle_root: felt252,
    borrow_amount: u256,
    btc_price: u256,
    usdc_price: u256,
    min_health_factor: u256,
    nullifier: felt252,
}

#[derive(Drop, Serde, Clone)]
pub struct ExitPublicInputs {
    commitment: felt252,
    btc_amount: u256,
    merkle_root: felt252,
    health_factor: u256,
    nullifier: felt252,
}

#[starknet::contract]
pub mod VesuVault {
    use super::{
        ArrayTrait, ContractAddress, IERC20Dispatcher, IERC20DispatcherTrait, 
        IVesuVault, u256, BorrowPublicInputs, ExitPublicInputs
    };
    use core::poseidon::poseidon_hash_span;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        merkle_root: felt252,
        total_deposited: u256,
        total_borrowed: u256,
        commitment_count: u64,
        commitments: Map<felt252, (u256, felt252)>,
        user_commitments: Map<ContractAddress, felt252>,
        nullifiers: Map<felt252, bool>,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
        vesu_pool: ContractAddress,
        verifier: ContractAddress,
        pragma_oracle: ContractAddress,
        min_health_factor: u256,
        buffer_percentage: u256,
        paused: bool,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
        Borrowed: Borrowed,
        EmergencyExited: EmergencyExited,
        Paused: Paused,
        Unpaused: Unpaused,
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

    #[derive(Drop, starknet::Event)]
    pub struct Borrowed {
        #[key]
        nullifier: felt252,
        amount: u256,
        recipient: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyExited {
        #[key]
        user: ContractAddress,
        amount: u256,
        commitment: felt252,
        fee: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Paused {}

    #[derive(Drop, starknet::Event)]
    pub struct Unpaused {}

    #[constructor]
    fn constructor(
        ref self: ContractState,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
        vesu_pool: ContractAddress,
        verifier: ContractAddress,
        pragma_oracle: ContractAddress,
        min_health_factor: u256,
        buffer_percentage: u256,
        owner: ContractAddress
    ) {
        self.wbtc_token.write(wbtc_token);
        self.usdc_token.write(usdc_token);
        self.vesu_pool.write(vesu_pool);
        self.verifier.write(verifier);
        self.pragma_oracle.write(pragma_oracle);
        self.min_health_factor.write(min_health_factor);
        self.buffer_percentage.write(buffer_percentage);
        self.owner.write(owner);
        self.merkle_root.write(0);
        self.commitment_count.write(0);
        self.total_deposited.write(u256 { low: 0, high: 0 });
        self.total_borrowed.write(u256 { low: 0, high: 0 });
        self.paused.write(false);
    }

    #[abi(embed_v0)]
    impl VesuVaultImpl of IVesuVault<ContractState> {
        fn deposit(ref self: ContractState, amount: u256) -> felt252 {
            assert(!self.paused.read(), 'Contract paused');
            assert(amount > 0, 'Amount must be positive');

            let caller = get_caller_address();
            
            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let vault_address = get_contract_address();
            
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
            assert(!self.paused.read(), 'Contract paused');
            assert(!self.is_nullifier_used(commitment), 'Commitment already used');

            let caller = get_caller_address();
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

        fn borrow(
            ref self: ContractState,
            proof: Span<felt252>,
            public_inputs: BorrowPublicInputs,
            recipient: ContractAddress
        ) -> bool {
            assert(!self.paused.read(), 'Contract paused');
            assert(public_inputs.borrow_amount > 0, 'Amount must be positive');
            assert(
                public_inputs.merkle_root == self.merkle_root.read(),
                'Stale merkle root'
            );
            assert(
                !self.nullifiers.read(public_inputs.nullifier),
                'Nullifier already used'
            );

            let (collateral_usd, debt_usd, _) = self.get_aggregate_health_factor();
            
            let new_debt_usd = debt_usd + public_inputs.borrow_amount * public_inputs.usdc_price;
            let new_health = if new_debt_usd.low > 0 {
                (collateral_usd * u256 { low: 1000000, high: 0 }) / new_debt_usd
            } else {
                u256 { low: 0, high: 0 }
            };

            let required_health = self.min_health_factor.read() * self.buffer_percentage.read();
            assert(new_health.low >= required_health.low, 'Insufficient aggregate health');

            let usdc = IERC20Dispatcher { contract_address: self.usdc_token.read() };
            usdc.transfer(recipient, public_inputs.borrow_amount);

            self.nullifiers.write(public_inputs.nullifier, true);
            self.total_borrowed.write(self.total_borrowed.read() + public_inputs.borrow_amount);

            self.emit(Event::Borrowed(Borrowed {
                nullifier: public_inputs.nullifier,
                amount: public_inputs.borrow_amount,
                recipient,
            }));

            true
        }

        fn emergency_exit(
            ref self: ContractState,
            proof: Span<felt252>,
            public_inputs: ExitPublicInputs
        ) -> bool {
            assert(!self.paused.read(), 'Contract paused');
            assert(public_inputs.health_factor.low >= 150, 'Health too low for exit');
            assert(
                !self.nullifiers.read(public_inputs.nullifier),
                'Nullifier already used'
            );

            let user_collateral = public_inputs.btc_amount;
            let exit_fee = (user_collateral * u256 { low: 2, high: 0 }) / u256 { low: 100, high: 0 };
            let withdraw_amount = user_collateral - exit_fee;

            let wbtc = IERC20Dispatcher { contract_address: self.wbtc_token.read() };
            let caller = get_caller_address();
            wbtc.transfer(caller, withdraw_amount);

            self.nullifiers.write(public_inputs.nullifier, true);
            self.total_deposited.write(self.total_deposited.read() - user_collateral);

            self.emit(Event::EmergencyExited(EmergencyExited {
                user: caller,
                amount: withdraw_amount,
                commitment: public_inputs.commitment,
                fee: exit_fee,
            }));

            true
        }

        fn get_aggregate_health_factor(self: @ContractState) -> (u256, u256, u256) {
            let collateral = self.total_deposited.read();
            let debt = self.total_borrowed.read();

            let btc_price = self.get_btc_price();
            let usdc_price = self.get_usdc_price();

            let collateral_usd = (collateral * btc_price) / u256 { low: 100000000, high: 0 };
            let debt_usd = (debt * usdc_price) / u256 { low: 1000000, high: 0 };

            let health_factor = if debt_usd.low > 0 {
                (collateral_usd * u256 { low: 1000000, high: 0 }) / debt_usd
            } else {
                u256 { low: 0, high: 0 }
            };

            (collateral_usd, debt_usd, health_factor)
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

        fn get_total_borrowed(self: @ContractState) -> u256 {
            self.total_borrowed.read()
        }

        fn get_user_deposit(self: @ContractState, commitment: felt252) -> (u256, felt252) {
            self.commitments.read(commitment)
        }

        fn get_commitment(self: @ContractState, user: ContractAddress) -> felt252 {
            self.user_commitments.read(user)
        }

        fn get_paused(self: @ContractState) -> bool {
            self.paused.read()
        }

        fn get_min_health_factor(self: @ContractState) -> u256 {
            self.min_health_factor.read()
        }

        fn get_buffer_percentage(self: @ContractState) -> u256 {
            self.buffer_percentage.read()
        }

        fn get_btc_price(self: @ContractState) -> u256 {
            u256 { low: 65000000000, high: 0 }
        }

        fn get_usdc_price(self: @ContractState) -> u256 {
            u256 { low: 1000000, high: 0 }
        }

        fn pause(ref self: ContractState) -> bool {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can pause');
            self.paused.write(true);
            self.emit(Event::Paused(Paused {}));
            true
        }

        fn unpause(ref self: ContractState) -> bool {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can unpause');
            self.paused.write(false);
            self.emit(Event::Unpaused(Unpaused {}));
            true
        }

        fn set_verifier(ref self: ContractState, verifier: ContractAddress) -> bool {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can set verifier');
            self.verifier.write(verifier);
            true
        }

        fn set_oracle(ref self: ContractState, oracle: ContractAddress) -> bool {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), 'Only owner can set oracle');
            self.pragma_oracle.write(oracle);
            true
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
