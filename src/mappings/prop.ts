import { Prop, FundingRate, User } from "../generated/schema";
import { VoteCast } from "../generated/templates/Proposal/Proposal";
import { Proposal as PropContract } from "../generated/templates/Proposal/Proposal";
import { loadOrCreateVote } from "../utils";

/**
 * Called when a user submits a vote to a proposal.
 */
export function handleVote(event: VoteCast): void {
	// Need to sync funding details
	const propAddr = event.address;

	const propContract = PropContract.bind(propAddr);

	// Transaction recip is the contract of the prop being voted on
	const prop = Prop.load(propAddr.toHexString());
	if (prop == null) return;

	// Update details of the funding
	const newRate = propContract.finalFundsRate();

	const rate = FundingRate.load(prop.rate);
	if (rate == null) return;

	rate.value = newRate.value;
	rate.save();

	// Save a record of the user's submitted vote (or alter an existing one)
	const voter = User.load(event.transaction.from.toHexString());
	if (voter == null) return;

	const vote = loadOrCreateVote(event.block.timestamp, voter, prop);
	vote.votes = vote.votes.plus(event.params.votes);
	vote.kind = ["For", "Against"][event.params.kind];

	if (event.params.kind == 0)
		prop.votesFor = prop.votesFor.plus(event.params.votes);
	else prop.votesAgainst = prop.votesAgainst.plus(event.params.votes);

	prop.save();
	voter.save();
	vote.save();
}
