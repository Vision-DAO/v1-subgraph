import { Proposal as PropSrc } from "../generated/templates";
import {
	Idea as IdeaContract,
	ProposalSubmitted,
	IdeaFunded,
} from "../generated/templates/Idea/Idea";
import { Proposal as PropContract } from "../generated/templates/Proposal/Proposal";
import {
	Idea,
	Prop,
	User,
	FundingRate,
	AuthorProfile,
} from "../generated/schema";
import { loadOrCreateUser, loadOrCreateProfile, makeFRID } from "../utils";

export const handleProposalSubmitted = (event: ProposalSubmitted) => {
	// Acting on the Idea that is governing, if the event is emitted
	const gov = Idea.load(event.transaction.to.toHexString());

	// For fetching details of the funding
	const propContract = PropContract.bind(event.receipt.contractAddress);

	// Extract initial details of the funding in a readable format
	const rate = new FundingRate(
		makeFRID(event.transaction.from.toHexString(), propContract.toFund())
	);
	const rateContract = propContract.rate();
	rate.token = rateContract.value0;
	rate.value = rateContract.value1;
	rate.intervalLength = rateContract.value2;
	rate.expiry = rateContract.value3;
	rate.lastClaimed = rateContract.value4;
	rate.kind = rateContract.value5 === 0 ? "Treasury" : "Mint";

	// Idea is a factory
	const prop = new Prop(event.receipt.contractAddress.toHexString());
	prop.funder = gov.id;
	prop.toFund = propContract.toFund();
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
	rate.lastClaimed = event.block.number;
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
