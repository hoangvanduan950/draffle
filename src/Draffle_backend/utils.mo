import Random "mo:base/Random";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Icrc1Ledger "canister:icrc1_ledger_canister";

module Utils {
    func bit(b : Bool) : Nat {
        if (b) 1 else 0;
    };

    // Use a finite source of randomness defined as `f`.
    // Return an optional random number between [0..`max`) using rejection sampling.
    // A return value of `null` indicates that `f` is exhausted and should be replaced.
    func chooseMax(f : Random.Finite, max : Nat) : ?Nat {
        assert max > 0;
        do ? {
            var n = max - 1 : Nat;
            var k = 0;
            while (n != 0) {
                k *= 2;
                k += bit(f.coin()!);
                n /= 2;
            };
            if (k < max) k else chooseMax(f, max)!;
        };
    };

    public func random(max : Nat) : async Nat {
        var f = Random.Finite(await Random.blob());
        switch (chooseMax(f, max)) {
            case (?rand) {
                return rand;
            };
            case null {
                return Int.abs(Time.now()) % max;
            };
        };
    };

    public let transferFee : Nat = 10_000;

    public func transfer_funds_from_user(user : Principal, _amount : Nat, receiver : Principal) : async Bool {
        let transferResults = await Icrc1Ledger.icrc2_transfer_from({
            spender_subaccount = null;

            from = {
                owner = user;
                subaccount = null;
            };
            to = {
                owner = receiver;
                subaccount = null;
            };
            amount = _amount;
            fee = null;
            memo = null;
            created_at_time = null;
        });

        switch (transferResults) {
            case (#Ok(_)) { return true };
            case (#Err(_)) {
                return false;
            };
        };
    };

    public func transfer_tokens_from_canister(_amount : Nat, user : Principal) : async Bool {
        let transferResults = await Icrc1Ledger.icrc1_transfer({
            from_subaccount = null;
            to = {
                owner = user;
                subaccount = null;
            };
            fee = null;
            amount = _amount;
            memo = null;
            created_at_time = null;
        });

        switch (transferResults) {
            case (#Ok(_)) { return true };
            case (#Err(_)) { return false };
        };

    };
};
