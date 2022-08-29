import { Prop, FundingRate, Voter } from "../generated/schema";
import { VoteCast } from "../generated/templates/Proposal/Proposal";
import { Proposal as PropContract } from "../generated/templates/Proposal/Proposal";
import { loadOrCreateVote } from "../utils";

/**
 * Called when a user submits a vote to a proposal.
 */
export const handleVote = (event: VoteCast) => {
	// Need to sync funding details
	const propAddr = event.transaction.to;
	const propContract = PropContract.bind(propAddr);

	// Transaction recip is the contract of the prop being voted on
	const prop = Prop.load(propAddr.toHexString());

	// Update details of the funding
	const newRate = propContract.rate();
	const rate = FundingRate.load(prop.rate);

	rate.value = newRate.value1;
	rate.intervalLength = newRate.value2;
	rate.expiry = newRate.value3;
	rate.lastClaimed = newRate.value4;
	rate.save();

	// Save a record of the user's submitted vote (or alter an existing one)
	const voter = Voter.load(event.transaction.from.toHexString());
	const vote = loadOrCreateVote(voter, prop);
	vote.votes = vote.votes.plus(event.params.votes);

	// Update the record of their vote to have the details they specified
	const voteRate = FundingRate.load(vote.rate);
	const votedRate = event.params.rate;
	voteRate.value = votedRate.value;
	voteRate.intervalLength = votedRate.intervalLength;
	voteRate.expiry = votedRate.expiry;
	voteRate.lastClaimed = votedRate.lastClaimed;
	voteRate.save();

	voter.save();
	vote.save();
};
