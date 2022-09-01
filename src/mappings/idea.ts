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

export function handleProposalSubmitted(event: ProposalSubmitted): void {
	// Acting on the Idea that is governing, if the event is emitted
	const daoAddr = event.address;

	const gov = Idea.load(daoAddr.toHexString());
	if (gov === null) return;

	// For fetching details of the funding
	const receipt = event.receipt;
	if (receipt === null) return;

	const propContract = PropContract.bind(receipt.contractAddress);
	if (propContract === null) return;

	// Extract initial details of the funding in a readable format
	const rate = new FundingRate(
		makeFRID(
			event.transaction.from.toHexString(),
			propContract.toFund().toHexString()
		)
	);
	const rateContract = propContract.finalFundsRate();
	rate.token = rateContract.token.toHexString();
	rate.value = rateContract.value;
	rate.intervalLength = rateContract.intervalLength;
	rate.expiry = rateContract.expiry;
	rate.lastClaimed = rateContract.lastClaimed;
	rate.kind = ["Treasury", "Mint"][rateContract.kind];

	// Idea is a factory
	const prop = new Prop(receipt.contractAddress.toHexString());
	prop.funder = gov.id;
	prop.toFund = propContract.toFund().toHexString();
	prop.rate = rate.id;
	prop.votes = [];
	prop.voters = [];
	prop.ipfsAddr = propContract.ipfsAddr();
	prop.votesFor = BigInt.zero();
	prop.votesAgainst = BigInt.zero();
	prop.title = propContract.title();
	prop.expiration = propContract.expiresAt();
	prop.status = "Pending";

	// Update list of proposals
	const activeProps = gov.activeProps;
	activeProps.push(prop.id);
	gov.activeProps = activeProps;

	// Add the new idea to the author's record
	const author = loadOrCreateUser(event.transaction.from.toHexString());
	const prof = loadOrCreateProfile(author, gov.id);
	prop.author = author.id;

	const authRec = AuthorProfile.load(prof.props);
	if (authRec === null) return;

	const props = authRec.props;
	props.push(prop.id);
	authRec.props = props;

	authRec.save();

	// Save to DB, and listen
	gov.save();
	prop.save();
	rate.save();
	author.save();
	PropSrc.create(receipt.contractAddress);
}

export function handleIdeaFunded(event: IdeaFunded): void {
	const daoAddr = event.address;

	const gov = Idea.load(daoAddr.toHexString());
	if (gov === null) return;

	const prop = Prop.load(event.params.prop.toHexString());
	if (prop === null) return;

	// Once the proposal is accepted, funding begins
	const rate = FundingRate.load(prop.rate);
	if (rate === null) return;

	// Mark the proposal as accepted
	prop.status = "Accepted";
	rate.lastClaimed = event.block.timestamp;
	let propI = -1;

	for (let i = 0; i < gov.activeProps.length; i++) {
		const propId = gov.activeProps[i];

		if (propId === event.params.prop.toHexString()) {
			propI = i;

			break;
		}
	}

	if (propI !== -1) gov.activeProps.splice(propI, 1);

	const accepted = gov.acceptedProps;
	accepted.push(prop.id);
	gov.acceptedProps = accepted;

	// Mark old funding rates to this beneficiary as void, if there are any
	let oldRate = FundingRate.load(makeFRID(prop.funder, prop.toFund));

	if (oldRate === null) {
		oldRate = new FundingRate(makeFRID(prop.funder, prop.toFund));

		const children = gov.children;
		children.push(oldRate.id);
		gov.children = children;

		const recipient = Idea.load(daoAddr.toHexString());

		// Update the funders of the Idea receiving funds, if there is one (could be
		// normal ETH address)
		if (recipient !== null) {
			const parents = recipient.parents;
			parents.push(prop.id);
			recipient.parents = parents;

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
}

/**
 * Called when the DAO managing a proposal fails to get 50% majority for it.
 * Marks the proposal as rejected and orphans it.
 */
export function handleProposalRejected(event: ProposalRejected): void {
	const daoAddr = event.address;

	const gov = Idea.load(daoAddr.toHexString());
	if (gov === null) return;

	const prop = Prop.load(event.params.prop.toHexString());
	if (prop === null) return;

	// Mark the proposal as rejected
	prop.status = "Rejected";

	// Remove it from pending props
	let propI = -1;

	for (let i = 0; i < gov.activeProps.length; i++) {
		if (gov.activeProps[i] === event.params.prop.toHexString()) propI = i;
	}

	if (propI !== -1) gov.activeProps.splice(propI, 1);

	const rejected = gov.rejectedProps;
	rejected.push(prop.id);
	gov.rejectedProps = rejected;

	gov.save();
	prop.save();
}

/**
 * Called when a user releases funds that are available for a funded project.
 */
export function handleFundingDispersed(event: FundingDispersed): void {
	// Just update the claim date, other required ops are performed by transfer
	// handler
	const daoAddr = event.address;

	const rate = FundingRate.load(
		makeFRID(daoAddr.toHexString(), event.params.to.toHexString())
	);
	if (rate === null) return;

	rate.lastClaimed = event.block.timestamp;
	rate.save();
}

class Actor {
	dao: Idea | null;
	id: string;
}

/**
 * Adds the specified amount to the balance of the DAO user (their investor
 * profile).
 */
const changeInvestorProfile = (
	investor: User,
	token: string,
	amount: BigInt
): void => {
	const prof = loadOrCreateProfile(investor, token);

	const iProf = InvestorProfile.load(prof.tokens);
	// This is literally impossible
	if (iProf === null) return;

	iProf.balance = iProf.balance.plus(amount);

	iProf.save();
	prof.save();
};

/**
 * Increments the treasury of the specified dao by the given amount.
 */
const changeTreasury = (dao: Idea, token: string, amount: BigInt): void => {
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
 * Called when a user transfers tokens of a specific DAO.
 */
export function handleTransfer(event: TransferEvent): void {
	// A DAO, a user, or the zero address could be making this transfer
	const sDao = Idea.load(event.params.from.toHexString());
	const rDao = Idea.load(event.params.to.toHexString());

	// Record the transfer
	const transfer = new Transfer(event.transaction.hash.toHexString());
	transfer.value = event.params.value;
	transfer.hash = event.transaction.hash.toHexString();

	// Increment or decrement balances of sender and recipient
	const sender: Actor = { dao: sDao, id: event.params.from.toHexString() };
	const recip: Actor = { dao: rDao, id: event.params.to.toHexString() };
	const actors = [sender, recip];

	const token = event.address;

	// Pardon this dogshit iteration, assemblyscript is ultra omega ass
	// This codebase was moderately clean before I had to refactor it
	for (let i = 0; i < actors.length; i++) {
		const item = actors[i];

		const actor = item.dao;
		const id = item.id;

		// Subtract if we're altering the sender balance, add if recip
		let amt = event.params.value;
		if (i === 0) amt = event.params.value.times(BigInt.fromI32(-1));

		if (actor === null) {
			const user = loadOrCreateUser(id);

			const transfers = user.transfers;
			transfers.push(transfer.id);
			user.transfers = transfers;

			if (i === 0) transfer.sendUser = user.id;
			else transfer.recipUser = user.id;

			changeInvestorProfile(user, token.toHexString(), amt);
			user.save();

			continue;
		}

		changeTreasury(actor, token.toHexString(), amt);

		const transfers = actor.transfers;
		transfers.push(transfer.id);
		actor.transfers = transfers;

		if (i === 0) transfer.sendDao = actor.id;
		else transfer.recipDao = actor.id;

		actor.save();

		continue;
	}

	transfer.save();
}
