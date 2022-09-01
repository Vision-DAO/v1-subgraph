import {
	User,
	Vote,
	UserProfile,
	AuthorProfile,
	Prop,
	Idea,
	InvestorProfile,
	VoterProfile,
} from "./generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Where tokens that are newly minted come from.
 */
export const ETH_TOKEN = "0x0000000000000000000000000000000000";

export interface Entity<T> {
	load(id: string): T | null;
	new (id: string): T;
}

/**
 * Makes a bilateral ID from a person to a DAO.
 */
export const makeIdUD = (nature: string, user: string, dao: string): string =>
	`${nature.substring(0, 1)}${user}:${dao}`;

/**
 * Creates an ID for a funding rate related to a user, or just a proposal in general.
 */
export const makeFRID = (ctx: string, prop: string): string => `${ctx}:${prop}`;

/**
 * Creates an ID for a treasury balance of a user or DAO.
 */
export const makeTreasuryID = (uID: string, token: string): string =>
	`${uID}:${token}`;

/**
 * Creates an ID for a vote cast on a proposal by a user.
 */
export const makeVoteID = (uID: string, propId: string): string =>
	`vote${uID}:${propId}`;

/**
 * Loads the existing user or creates a new one with zero values.
 */
export const loadOrCreateUser = (id: string): User => {
	let u = User.load(id);

	// Zero out required fields
	if (u === null) {
		u = new User(id);
		u.ideas = [];
		u.transfers = [];
	}

	return u;
};

/**
 * Loads the existing profile for a user's interactions with a DAO, or creates
 * their profile.
 */
export const loadOrCreateProfile = (u: User, daoId: string): UserProfile => {
	const uid = u.id;

	let prof = UserProfile.load(`${uid}:${daoId}`);

	if (prof === null) {
		// Make a container for sub-profiles
		prof = new UserProfile(makeIdUD("general", u.id, daoId));
		prof.dao = daoId;
		prof.user = u.id;

		// Each interaction profile has 3 sub-profiles
		const aProf = new AuthorProfile(makeIdUD("author", u.id, daoId));
		aProf.user = u.id;
		aProf.dao = daoId;
		aProf.props = [];
		prof.props = aProf.id;

		const iProf = new InvestorProfile(makeIdUD("investor", u.id, daoId));
		iProf.user = u.id;
		iProf.dao = daoId;
		iProf.balance = BigInt.fromU32(0);
		prof.tokens = iProf.id;

		const vProf = new VoterProfile(makeIdUD("voter", u.id, daoId));
		vProf.user = u.id;
		vProf.dao = daoId;
		vProf.votes = [];
		prof.votes = vProf.id;

		const dao = Idea.load(daoId);

		// Update membership in the DAO itself
		if (dao !== null) {
			const users = dao.users;

			users.push(prof.id);
			dao.users = users;
			dao.save();
		}

		// Write changes to all profiles
		aProf.save();
		iProf.save();
		vProf.save();

		prof.save();
	}

	const ideas = u.ideas;
	ideas.push(prof.id);
	u.ideas = ideas;

	return prof;
};

/**
 * Finds a vote cast by a user, or creates a blank new one.
 * Saves a record of the newly created vote.
 */
export const loadOrCreateVote = (
	timestamp: BigInt,
	u: User,
	prop: Prop
): Vote => {
	const id = makeVoteID(u.id, prop.id);
	let v = Vote.load(id);

	if (v !== null) {
		return v;
	}

	v = new Vote(id);
	v.votes = BigInt.zero();
	v.kind = "For";
	v.prop = prop.id;
	v.createdAt = timestamp;

	// Register the vote in the proposal
	const voters = prop.voters;
	voters.push(u.id);
	prop.voters = voters;

	const votes = prop.votes;
	votes.push(v.id);
	prop.votes = votes;

	// Register the vote in the user's list of votes
	const profile = loadOrCreateProfile(u, prop.funder);
	const vProfile = VoterProfile.load(profile.votes);
	if (vProfile === null) return v;

	const profVotes = vProfile.votes;
	profVotes.push(v.id);
	vProfile.votes = profVotes;

	profile.save();
	vProfile.save();
	prop.save();
	u.save();
	v.save();

	return v;
};
