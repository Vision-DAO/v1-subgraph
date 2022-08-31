import { FactoryCreated, IdeaCreated } from "../generated/Factory/Factory";
import { Idea as IdeaSrc } from "../generated/templates";
import { Idea as IdeaContract } from "../generated/templates/Idea/Idea";
import { Registry, Idea } from "../generated/schema";

/**
 * Called when the registry gets created
 */
export function handleFactoryCreated(event: FactoryCreated): void {
	const receipt = event.receipt;

	if (receipt === null) return;

	const reg = new Registry(receipt.contractAddress.toHexString());
	reg.ideas = [];
	reg.save();
}

/**
 * Called when an instance of the idea contract is created by the registry.
 */
export function handleIdeaCreated(event: IdeaCreated): void {
	// Create entity
	const idea = new Idea(event.params.idea.toHexString());

	const to = event.transaction.to;
	if (to === null) return;

	// Recipient is the registry
	const reg = Registry.load(to.toHexString());
	if (reg === null) return;

	const ideas = reg.ideas;
	ideas.push(idea.id);
	reg.ideas = ideas;

	// No activity yet
	idea.children = [];
	idea.activeProps = [];
	idea.acceptedProps = [];
	idea.rejectedProps = [];
	idea.parents = [];
	idea.users = [];
	idea.treasury = [];
	idea.transfers = [];

	// Details stored in contract state
	const deployed = IdeaContract.bind(event.params.idea);
	idea.ipfsAddr = deployed.ipfsAddr();
	idea.ticker = deployed.symbol();
	idea.name = deployed.name();
	idea.supply = deployed.totalSupply();

	// Save the object in the db
	idea.save();

	// Listen to the contract
	IdeaSrc.create(event.params.idea);
}
