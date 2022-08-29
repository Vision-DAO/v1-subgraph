import {
	User,
	UserProfile,
	AuthorProfile,
	InvestorProfile,
	VoterProfile,
} from "./generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

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
 * Loads the existing user or creates a new one with zero values.
 */
export const loadOrCreateUser = (id: string): User => {
	let u = User.load(id);

	// Zero out required fields
	if (u === null) {
		u = new User(id);
		u.ideas = [];
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
