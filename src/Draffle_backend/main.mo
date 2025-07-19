import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Bool "mo:base/Bool";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Timer "mo:base/Timer";
import Map "mo:motoko-hash-map/Map";
import Utils "utils";

actor class RaffleDApp() = this {
  type RaffleDetail = {
    id : Nat;
    title : Text;
    creator : Principal;
    startTime : Time.Time;
    endTime : Time.Time;
    noOfEntries : Nat;
    entryPrice : Nat;
    winner : ?Principal;
    winningEntry : ?Nat;
    reward : ?Nat;
    raffleCompleted : Bool;
    prizePool : Nat;
    numberOfParticipants : Nat;
  };

  type Raffle = RaffleDetail and {
    participantEntries : Map.Map<Principal, [Nat]>;
  };

  let { nhash; phash } = Map;

  stable let raffles = Map.new<Nat, Raffle>();
  stable var nextRaffleId : Nat = 1;

  public shared ({ caller }) func startRaffle({
    title : Text;
    duration : Nat;
    entryPrice : Nat;
    initialPrize : Nat;
  }) : async Nat {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous caller");
    };

    let transfered = await Utils.transfer_funds_from_user(caller, initialPrize * 100_000_000, Principal.fromActor(this));
    if (not transfered) {
      Debug.trap("transfer failed");
    };

    let startTime = Time.now();
    let endTime = startTime + duration * 1_000_000_000;

    let newRaffle : Raffle = {
      id = nextRaffleId;
      title;
      creator = caller;
      startTime;
      endTime;
      noOfEntries = 0;
      entryPrice;
      winner = null;
      winningEntry = null;
      reward = null;
      participantEntries = Map.new<Principal, [Nat]>();
      raffleCompleted = false;
      prizePool = initialPrize;
      numberOfParticipants = 0;
    };
    Map.set(raffles, nhash, nextRaffleId, newRaffle);
    nextRaffleId += 1;

    let _ = Timer.setTimer<system>(
      #seconds duration,
      func() : async () {
        await endRaffle(newRaffle.id);
      },
    );
    return newRaffle.id;
  };

  public query func getRaffleDetail(raffleId : Nat) : async RaffleDetail {
    switch (Map.get(raffles, nhash, raffleId)) {
      case (?raffle) { raffle };
      case null { Debug.trap("raffle not found") };
    };
  };

  public query func getAllRaffles() : async [RaffleDetail] {
    return Iter.toArray(Map.vals(raffles));
  };

  public shared ({ caller }) func getUserEntries(raffleId : Nat) : async [Nat] {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous caller");
    };
    switch (Map.get(raffles, nhash, raffleId)) {
      case (?raffle) {
        switch (Map.get(raffle.participantEntries, phash, caller)) {
          case (?entries) entries;
          case _ [];
        };
      };
      case _ [];
    };
  };

  public shared ({ caller }) func buyEntries(raffleId : Nat, numOfEntries : Nat) : async Bool {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Anonymous caller");
    };
    switch (Map.get(raffles, nhash, raffleId)) {
      case (?raffle) {
        let totalCost = numOfEntries * raffle.entryPrice;

        let transfered = await Utils.transfer_funds_from_user(caller, totalCost * 100_000_000, Principal.fromActor(this));
        if (not transfered) {
          Debug.trap("transfer failed");
        };

        let newEntries = Iter.toArray(Iter.range(raffle.noOfEntries, raffle.noOfEntries + numOfEntries - 1));

        let wasNewParticipant = if (Map.get(raffle.participantEntries, phash, caller) == null) true else false;

        let updatedEntries = switch (Map.get(raffle.participantEntries, phash, caller)) {
          case (?existing) Array.append(existing, newEntries);
          case _ newEntries;
        };
        Map.set(raffle.participantEntries, phash, caller, updatedEntries);

        let updatedRaffle = {
          raffle with noOfEntries = raffle.noOfEntries + numOfEntries;
          prizePool = raffle.prizePool + totalCost;
          numberOfParticipants = if (wasNewParticipant) raffle.numberOfParticipants + 1 else raffle.numberOfParticipants;
        };
        Map.set(raffles, nhash, raffleId, updatedRaffle);
        return true;
      };
      case _ return false;
    };
  };

  func endRaffle(raffleId : Nat) : async () {
    switch (Map.get(raffles, nhash, raffleId)) {
      case (?raffle) {
        if (raffle.noOfEntries == 0) {
          if (raffle.prizePool > 0) {
            let amount = raffle.prizePool * 100_000_000 - Utils.transferFee;
            let _ = await Utils.transfer_tokens_from_canister(amount, raffle.creator);
          };
          Map.set(raffles, nhash, raffleId, { raffle with raffleCompleted = true });
          return;
        };
        let winningIndex = await Utils.random(raffle.noOfEntries);

        var winner : ?Principal = null;
        for ((participant, entries) in Map.entries(raffle.participantEntries)) {
          if (Array.find<Nat>(entries, func(e) { e == winningIndex }) != null) {
            winner := ?participant;
          };
        };
        switch (winner) {
          case (?u) {
            let reward = (raffle.prizePool / 2) * 100_000_000 - Utils.transferFee;
            let _ = await Utils.transfer_tokens_from_canister(reward, u);
          };
          case null {};
        };

        let updatedRaffle : Raffle = {
          raffle with winner;
          winningEntry = ?winningIndex;
          reward = ?(raffle.prizePool / 2);
          raffleCompleted = true;
        };
        Map.set(raffles, nhash, raffleId, updatedRaffle);
      };
      case _ { Debug.trap("raffle not found") };
    };
  };

  public func random(max : Nat) : async Nat {
    return await Utils.random(max);
  };
};
