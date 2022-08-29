import {
	User,
	Vote,
	UserProfile,
	AuthorProfile,
	Prop,
	FundingRate,
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

export type ProfileNature = "author" | "investor" | "voter" | "general";
export type Profile =
	| [typeof AuthorProfile, "author"]
	| [typeof InvestorProfile, "investor"]
	| [typeof VoterProfile, "voter"];
type Profiles = Profile[];

/**
 * Makes a bilateral ID from a person to a DAO.
 */
export const makeIdUD = (
	nature: ProfileNature,
	user: string,
	dao: string
): string => `${nature.substring(0, 1)}${user}:${dao}`;

/**
 * Creates an ID for a funding rate related to a user, or just a proposal in general.
 */
export const makeFRID = (ctx: string, prop: string) => `${ctx}:${prop}`;

/**
 * Creates an ID for a treasury balance of a user or DAO.
 */
export const makeTreasuryID = (uID: string, token: string) => `${uID}:${token}`;

/**
 * Creates an ID for a vote cast on a proposal by a user.
 */
export const makeVoteID = (uID: string, propId: string) =>
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
 * Finds a vote cast by a user, or creates a blank new one.
 * Saves a record of the newly created vote.
 */
export const loadOrCreateVote = (u: User, prop: Prop): Vote => {
	const id = makeVoteID(u.id, prop.id);
	let v = Vote.load(id);

	if (v !== null) {
		return v;
	}

	// Record the user's distinct opinion about what rates should be
	const rate = new FundingRate(makeFRID(id, prop.id));
	rate.token = ETH_TOKEN;
	rate.intervalLength = BigInt.zero();
	rate.expiry = BigInt.zero();
	rate.lastClaimed = BigInt.zero();
	rate.kind = "Treasury";
	rate.save();

	v = new Vote(id);
	v.votes = BigInt.zero();
	v.rate = rate.id;
	v.prop = prop.id;

	// Register the vote in the proposal
	prop.voters.push(u.id);
	prop.votes.push(v.id);

	// Register the vote in the user's list of votes
	const profile = loadOrCreateProfile(u, prop.funder);
	const vProfile = VoterProfile.load(profile.votes);
	vProfile.votes.push(v.id);

	profile.save();
	vProfile.save();
	prop.save();
	u.save();
	v.save();
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
		(
			[
				[AuthorProfile, "author"],
				[InvestorProfile, "investor"],
				[VoterProfile, "voter"],
			] as Profiles
		).forEach(([ent, kind]: Profile) => {
			// Make a specific prop for the attribute
			const sProf = new ent(makeIdUD(kind, u.id, daoId));
			sProf.user = u.id;
			sProf.dao = daoId;

			if ("props" in sProf) {
				sProf.props = [];
				prof.props = sProf.id;
			}

			if ("balance" in sProf) {
				sProf.balance = BigInt.fromU32(0);
				prof.tokens = sProf.id;
			}

			if ("votes" in sProf) {
				sProf.votes = [];
				prof.votes = sProf.id;
			}

			sProf.save();
		});

		prof.save();
	}

	u.ideas.push(prof.id);

	return prof;
};
