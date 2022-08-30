import { Proposal as PropSrc } from "../generated/templates";
import {
	ProposalSubmitted,
	ProposalRejected,
	FundingDispersed,
	IdeaFunded,
	Transfer as TransferEvent,
} from "../generated/templates/Idea/Idea";
import { Proposal as PropContract } from "../generated/templates/Proposal/Proposal";
import {
	Idea,
	Prop,
	FundingRate,
	AuthorProfile,
	InvestorProfile,
	User,
	TreasuryBalance,
	Transfer,
} from "../generated/schema";
import {
	loadOrCreateUser,
	loadOrCreateProfile,
	makeFRID,
	makeTreasuryID,
} from "../utils";
import { BigInt } from "@graphprotocol/graph-ts/common/numbers";

export const handleProposalSubmitted = (event: ProposalSubmitted) => {
	// Acting on the Idea that is governing, if the event is emitted
	const gov = Idea.load(event.transaction.to.toHexString());

	// For fetching details of the funding
	const propContract = PropContract.bind(event.receipt.contractAddress);

	// Extract initial details of the funding in a readable format
	const rate = new FundingRate(
		makeFRID(
			event.transaction.from.toHexString(),
			propContract.toFund().toHexString()
		)
	);
	const rateContract = propContract.rate();
	rate.token = rateContract.value0.toHexString();
	rate.value = rateContract.value1;
	rate.intervalLength = rateContract.value2;
	rate.expiry = rateContract.value3;
	rate.lastClaimed = rateContract.value4;
	rate.kind = rateContract.value5 === 0 ? "Treasury" : "Mint";

	// Idea is a factory
	const prop = new Prop(event.receipt.contractAddress.toHexString());
	prop.funder = gov.id;
	prop.toFund = propContract.toFund().toHexString();
	prop.rate = rate.id;
	prop.votes = [];
	prop.voters = [];
	prop.ipfsAddr = propContract.ipfsAddr();
	prop.title = propContract.title();
	prop.expiration = propContract.expiresAt();
	prop.status = "Pending";

	// Update list of proposals
	gov.activeProps.push(prop.id);

	// Add the new idea to the author's record
	const author = loadOrCreateUser(event.transaction.from.toHexString());
	const prof = loadOrCreateProfile(author, gov.id);
	prop.author = author.id;

	const authRec = AuthorProfile.load(prof.props);
	authRec.props.push(prop.id);
	authRec.save();

	// Save to DB, and listen
	gov.save();
	prop.save();
	rate.save();
	author.save();
	PropSrc.create(event.receipt.contractAddress);
};

export const handleIdeaFunded = (event: IdeaFunded) => {
	const gov = Idea.load(event.transaction.to.toHexString());
	const prop = Prop.load(event.params.prop.toHexString());

	// Once the proposal is accepted, funding begins
	const rate = FundingRate.load(prop.rate);

	// Mark the proposal as accepted
	prop.status = "Accepted";
	rate.lastClaimed = event.block.timestamp;
	const propI = gov.activeProps.findIndex(
		(p: string) => p === event.params.prop.toHexString()
	);
	gov.activeProps.splice(propI, 1);
	gov.acceptedProps.push(prop.id);

	// Mark old funding rates to this beneficiary as void, if there are any
	let oldRate = FundingRate.load(makeFRID(prop.funder, prop.toFund));

	if (oldRate === null) {
		oldRate = new FundingRate(makeFRID(prop.funder, prop.toFund));
		gov.children.push(oldRate.id);

		const recipient = Idea.load(event.transaction.to.toHexString());

		// Update the funders of the Idea receiving funds, if there is one (could be
		// normal ETH address)
		if (recipient !== null) {
			recipient.parents.push(prop.id);
			recipient.save();
		}
	}

	oldRate.token = rate.token;
	oldRate.value = rate.value;
	oldRate.intervalLength = rate.intervalLength;
	oldRate.expiry = rate.expiry;
	oldRate.lastClaimed = rate.lastClaimed;
	oldRate.kind = rate.kind;

	gov.save();
	rate.save();
	prop.save();
	oldRate.save();
};

/**
 * Called when the DAO managing a proposal fails to get 50% majority for it.
 * Marks the proposal as rejected and orphans it.
 */
export const handleProposalRejected = (event: ProposalRejected) => {
	const gov = Idea.load(event.transaction.to.toHexString());
	const prop = Prop.load(event.params.prop.toHexString());

	// Mark the proposal as rejected
	prop.status = "Rejected";

	// Remove it from pending props
	const propI = gov.activeProps.findIndex(
		(p: string) => p === event.params.prop.toHexString()
	);
	gov.activeProps.splice(propI, 1);
	gov.rejectedProps.push(prop.id);

	gov.save();
	prop.save();
};

/**
 * Called when a user releases funds that are available for a funded project.
 */
export const handleFundingDispersed = (event: FundingDispersed) => {
	// Just update the claim date, other required ops are performed by transfer
	// handler
	const rate = FundingRate.load(
		makeFRID(
			event.transaction.to.toHexString(),
			event.params.to.toHexString()
		)
	);
	rate.lastClaimed = event.block.timestamp;
	rate.save();
};

/**
 * Called when a user transfers tokens of a specific DAO.
 */
export const handleTransfer = (event: TransferEvent) => {
	type MoneyActor = User | Idea | null;

	// A DAO, a user, or the zero address could be making this transfer
	const sender: MoneyActor = userOrDao(event.transaction.from.toHexString());
	const recipient: MoneyActor = userOrDao(event.params.to.toHexString());

	// Record the transfer
	const transfer = new Transfer(event.transaction.hash.toHexString());

	// Increment or decrement balances of sender and recipient
	[sender, recipient].forEach((actor, i) => {
		if (actor === null) return;

		// Subtract if we're altering the sender balance, add if recip
		const amt =
			i === 0
				? event.params.value.times(BigInt.fromI32(-1))
				: event.params.value;

		actor.transfers.push(transfer.id);

		if ("treasury" in sender) {
			actor = <Idea>actor;
			changeTreasury(actor, event.transaction.to.toHexString(), amt);

			if (i === 0) transfer.sendDao = actor.id;
			else transfer.recipDao = actor.id;

			return;
		}

		if (i === 0) transfer.sendUser = actor.id;
		else transfer.recipUser = actor.id;

		actor = <User>actor;
		changeInvestorProfile(actor, event.transaction.to.toHexString(), amt);
	});

	transfer.save();
	sender.save();
	recipient.save();
};

/**
 * Increments the treasury of the specified dao by the given amount.
 */
const changeTreasury = (dao: Idea, token: string, amount: BigInt) => {
	// Make or add a new treasury balance, if the DAO hasn't ever delt with this token
	const id = makeTreasuryID(dao.id, token);
	let treasury = TreasuryBalance.load(id);

	if (treasury === null) {
		treasury = new TreasuryBalance(id);
		treasury.token = token;
		treasury.holder = dao.id;
	}

	treasury.balance = treasury.balance.plus(amount);
	treasury.save();
};

/**
 * Adds the specified amount to the balance of the DAO user (their investor
 * profile).
 */
const changeInvestorProfile = (
	investor: User,
	token: string,
	amount: BigInt
) => {
	const prof = loadOrCreateProfile(investor, token);
	const iProf = InvestorProfile.load(prof.tokens);
	iProf.balance = iProf.balance.plus(amount);

	iProf.save();
	prof.save();
};

/**
 * Loads a user, or a DAO as a backup.
 */
const userOrDao = (id: string): User | Idea | null => {
	const u = User.load(id);

	if (u === null) return Idea.load(id);

	return u;
};
