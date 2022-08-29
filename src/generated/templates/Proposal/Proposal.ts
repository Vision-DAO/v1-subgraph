// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class NewProposal extends ethereum.Event {
  get params(): NewProposal__Params {
    return new NewProposal__Params(this);
  }
}

export class NewProposal__Params {
  _event: NewProposal;

  constructor(event: NewProposal) {
    this._event = event;
  }

  get prop(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get governed(): Address {
    return this._event.parameters[1].value.toAddress();
  }

  get toFund(): Address {
    return this._event.parameters[2].value.toAddress();
  }

  get propIpfsHash(): string {
    return this._event.parameters[3].value.toString();
  }

  get expiresAt(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }
}

export class VoteCast extends ethereum.Event {
  get params(): VoteCast__Params {
    return new VoteCast__Params(this);
  }
}

export class VoteCast__Params {
  _event: VoteCast;

  constructor(event: VoteCast) {
    this._event = event;
  }

  get voter(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get votes(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get rate(): VoteCastRateStruct {
    return changetype<VoteCastRateStruct>(
      this._event.parameters[2].value.toTuple()
    );
  }
}

export class VoteCastRateStruct extends ethereum.Tuple {
  get token(): Address {
    return this[0].toAddress();
  }

  get value(): BigInt {
    return this[1].toBigInt();
  }

  get intervalLength(): BigInt {
    return this[2].toBigInt();
  }

  get expiry(): BigInt {
    return this[3].toBigInt();
  }

  get lastClaimed(): BigInt {
    return this[4].toBigInt();
  }

  get kind(): i32 {
    return this[5].toI32();
  }
}

export class Proposal__rateResult {
  value0: Address;
  value1: BigInt;
  value2: BigInt;
  value3: BigInt;
  value4: BigInt;
  value5: i32;

  constructor(
    value0: Address,
    value1: BigInt,
    value2: BigInt,
    value3: BigInt,
    value4: BigInt,
    value5: i32
  ) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
    this.value4 = value4;
    this.value5 = value5;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromAddress(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    map.set("value3", ethereum.Value.fromUnsignedBigInt(this.value3));
    map.set("value4", ethereum.Value.fromUnsignedBigInt(this.value4));
    map.set(
      "value5",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(this.value5))
    );
    return map;
  }

  getToken(): Address {
    return this.value0;
  }

  getValue(): BigInt {
    return this.value1;
  }

  getIntervalLength(): BigInt {
    return this.value2;
  }

  getExpiry(): BigInt {
    return this.value3;
  }

  getLastClaimed(): BigInt {
    return this.value4;
  }

  getKind(): i32 {
    return this.value5;
  }
}

export class Proposal__refundsResultRateStruct extends ethereum.Tuple {
  get token(): Address {
    return this[0].toAddress();
  }

  get value(): BigInt {
    return this[1].toBigInt();
  }

  get intervalLength(): BigInt {
    return this[2].toBigInt();
  }

  get expiry(): BigInt {
    return this[3].toBigInt();
  }

  get lastClaimed(): BigInt {
    return this[4].toBigInt();
  }

  get kind(): i32 {
    return this[5].toI32();
  }
}

export class Proposal__refundsResult {
  value0: Proposal__refundsResultRateStruct;
  value1: BigInt;

  constructor(value0: Proposal__refundsResultRateStruct, value1: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromTuple(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    return map;
  }

  getRate(): Proposal__refundsResultRateStruct {
    return this.value0;
  }

  getVotes(): BigInt {
    return this.value1;
  }
}

export class Proposal__finalFundsRateResultValue0Struct extends ethereum.Tuple {
  get token(): Address {
    return this[0].toAddress();
  }

  get value(): BigInt {
    return this[1].toBigInt();
  }

  get intervalLength(): BigInt {
    return this[2].toBigInt();
  }

  get expiry(): BigInt {
    return this[3].toBigInt();
  }

  get lastClaimed(): BigInt {
    return this[4].toBigInt();
  }

  get kind(): i32 {
    return this[5].toI32();
  }
}

export class Proposal extends ethereum.SmartContract {
  static bind(address: Address): Proposal {
    return new Proposal("Proposal", address);
  }

  expiresAt(): BigInt {
    let result = super.call("expiresAt", "expiresAt():(uint256)", []);

    return result[0].toBigInt();
  }

  try_expiresAt(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("expiresAt", "expiresAt():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  governed(): Address {
    let result = super.call("governed", "governed():(address)", []);

    return result[0].toAddress();
  }

  try_governed(): ethereum.CallResult<Address> {
    let result = super.tryCall("governed", "governed():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  ipfsAddr(): string {
    let result = super.call("ipfsAddr", "ipfsAddr():(string)", []);

    return result[0].toString();
  }

  try_ipfsAddr(): ethereum.CallResult<string> {
    let result = super.tryCall("ipfsAddr", "ipfsAddr():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  nVoters(): BigInt {
    let result = super.call("nVoters", "nVoters():(uint256)", []);

    return result[0].toBigInt();
  }

  try_nVoters(): ethereum.CallResult<BigInt> {
    let result = super.tryCall("nVoters", "nVoters():(uint256)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  rate(): Proposal__rateResult {
    let result = super.call(
      "rate",
      "rate():(address,uint256,uint256,uint256,uint256,uint8)",
      []
    );

    return new Proposal__rateResult(
      result[0].toAddress(),
      result[1].toBigInt(),
      result[2].toBigInt(),
      result[3].toBigInt(),
      result[4].toBigInt(),
      result[5].toI32()
    );
  }

  try_rate(): ethereum.CallResult<Proposal__rateResult> {
    let result = super.tryCall(
      "rate",
      "rate():(address,uint256,uint256,uint256,uint256,uint8)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new Proposal__rateResult(
        value[0].toAddress(),
        value[1].toBigInt(),
        value[2].toBigInt(),
        value[3].toBigInt(),
        value[4].toBigInt(),
        value[5].toI32()
      )
    );
  }

  refunds(param0: Address): Proposal__refundsResult {
    let result = super.call(
      "refunds",
      "refunds(address):((address,uint256,uint256,uint256,uint256,uint8),uint256)",
      [ethereum.Value.fromAddress(param0)]
    );

    return changetype<Proposal__refundsResult>(
      new Proposal__refundsResult(
        changetype<Proposal__refundsResultRateStruct>(result[0].toTuple()),
        result[1].toBigInt()
      )
    );
  }

  try_refunds(param0: Address): ethereum.CallResult<Proposal__refundsResult> {
    let result = super.tryCall(
      "refunds",
      "refunds(address):((address,uint256,uint256,uint256,uint256,uint8),uint256)",
      [ethereum.Value.fromAddress(param0)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<Proposal__refundsResult>(
        new Proposal__refundsResult(
          changetype<Proposal__refundsResultRateStruct>(value[0].toTuple()),
          value[1].toBigInt()
        )
      )
    );
  }

  title(): string {
    let result = super.call("title", "title():(string)", []);

    return result[0].toString();
  }

  try_title(): ethereum.CallResult<string> {
    let result = super.tryCall("title", "title():(string)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toString());
  }

  toFund(): Address {
    let result = super.call("toFund", "toFund():(address)", []);

    return result[0].toAddress();
  }

  try_toFund(): ethereum.CallResult<Address> {
    let result = super.tryCall("toFund", "toFund():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  voters(param0: BigInt): Address {
    let result = super.call("voters", "voters(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);

    return result[0].toAddress();
  }

  try_voters(param0: BigInt): ethereum.CallResult<Address> {
    let result = super.tryCall("voters", "voters(uint256):(address)", [
      ethereum.Value.fromUnsignedBigInt(param0)
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  refundAll(): boolean {
    let result = super.call("refundAll", "refundAll():(bool)", []);

    return result[0].toBoolean();
  }

  try_refundAll(): ethereum.CallResult<boolean> {
    let result = super.tryCall("refundAll", "refundAll():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  finalFundsRate(): Proposal__finalFundsRateResultValue0Struct {
    let result = super.call(
      "finalFundsRate",
      "finalFundsRate():((address,uint256,uint256,uint256,uint256,uint8))",
      []
    );

    return changetype<Proposal__finalFundsRateResultValue0Struct>(
      result[0].toTuple()
    );
  }

  try_finalFundsRate(): ethereum.CallResult<
    Proposal__finalFundsRateResultValue0Struct
  > {
    let result = super.tryCall(
      "finalFundsRate",
      "finalFundsRate():((address,uint256,uint256,uint256,uint256,uint8))",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      changetype<Proposal__finalFundsRateResultValue0Struct>(value[0].toTuple())
    );
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get _propName(): string {
    return this._call.inputValues[0].value.toString();
  }

  get _jurisdiction(): Address {
    return this._call.inputValues[1].value.toAddress();
  }

  get _toFund(): Address {
    return this._call.inputValues[2].value.toAddress();
  }

  get _token(): Address {
    return this._call.inputValues[3].value.toAddress();
  }

  get _fundingType(): i32 {
    return this._call.inputValues[4].value.toI32();
  }

  get _proposalIpfsHash(): string {
    return this._call.inputValues[5].value.toString();
  }

  get _expiry(): BigInt {
    return this._call.inputValues[6].value.toBigInt();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class VoteCall extends ethereum.Call {
  get inputs(): VoteCall__Inputs {
    return new VoteCall__Inputs(this);
  }

  get outputs(): VoteCall__Outputs {
    return new VoteCall__Outputs(this);
  }
}

export class VoteCall__Inputs {
  _call: VoteCall;

  constructor(call: VoteCall) {
    this._call = call;
  }

  get _votes(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }

  get _rate(): VoteCall_rateStruct {
    return changetype<VoteCall_rateStruct>(
      this._call.inputValues[1].value.toTuple()
    );
  }
}

export class VoteCall__Outputs {
  _call: VoteCall;

  constructor(call: VoteCall) {
    this._call = call;
  }
}

export class VoteCall_rateStruct extends ethereum.Tuple {
  get token(): Address {
    return this[0].toAddress();
  }

  get value(): BigInt {
    return this[1].toBigInt();
  }

  get intervalLength(): BigInt {
    return this[2].toBigInt();
  }

  get expiry(): BigInt {
    return this[3].toBigInt();
  }

  get lastClaimed(): BigInt {
    return this[4].toBigInt();
  }

  get kind(): i32 {
    return this[5].toI32();
  }
}

export class RefundVotesCall extends ethereum.Call {
  get inputs(): RefundVotesCall__Inputs {
    return new RefundVotesCall__Inputs(this);
  }

  get outputs(): RefundVotesCall__Outputs {
    return new RefundVotesCall__Outputs(this);
  }
}

export class RefundVotesCall__Inputs {
  _call: RefundVotesCall;

  constructor(call: RefundVotesCall) {
    this._call = call;
  }
}

export class RefundVotesCall__Outputs {
  _call: RefundVotesCall;

  constructor(call: RefundVotesCall) {
    this._call = call;
  }
}

export class RefundAllCall extends ethereum.Call {
  get inputs(): RefundAllCall__Inputs {
    return new RefundAllCall__Inputs(this);
  }

  get outputs(): RefundAllCall__Outputs {
    return new RefundAllCall__Outputs(this);
  }
}

export class RefundAllCall__Inputs {
  _call: RefundAllCall;

  constructor(call: RefundAllCall) {
    this._call = call;
  }
}

export class RefundAllCall__Outputs {
  _call: RefundAllCall;

  constructor(call: RefundAllCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}
