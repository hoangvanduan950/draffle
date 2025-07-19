import { Principal } from "@dfinity/principal";
import { icrc1_ledger_canister } from "../../../declarations/icrc1_ledger_canister";
import { canisterId as backendPrincipal } from "../../../declarations/Draffle_backend";

export async function approve(amount: number) {
  return await icrc1_ledger_canister.icrc2_approve({
    spender: { owner: Principal.fromText(backendPrincipal), subaccount: [] },
    amount: BigInt(amount),
    fee: [],
    memo: [],
    from_subaccount: [],
    created_at_time: [],
    expected_allowance: [],
    expires_at: [],
  });
}

export async function tokenBalance(owner: Principal) {
  const balance = await icrc1_ledger_canister.icrc1_balance_of({
    owner,
    subaccount: [],
  });
  return balance;
}

export function tokenSymbol() {
  return icrc1_ledger_canister.icrc1_symbol();
}

export function transferFee() {
  return icrc1_ledger_canister.icrc1_fee();
}