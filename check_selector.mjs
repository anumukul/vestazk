import { hash } from 'starknet';
const selectors = ["borrow", "emergency_exit", "deposit", "withdraw", "__execute__", "execute"];
selectors.forEach(s => {
    console.log(`${s}: ${hash.getSelectorFromName(s)}`);
});
