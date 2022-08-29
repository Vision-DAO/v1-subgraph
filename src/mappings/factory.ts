import { FactoryCreated, IdeaCreated } from "../generated/Factory/Factory";
import { Idea as IdeaSrc } from "../generated/templates";
import { Idea as IdeaContract } from "../generated/templates/Idea/Idea";
import { Registry, Idea } from "../generated/schema";

/**
 * Called when the registry gets created
 */
export const handleFactoryCreated = (event: FactoryCreated) => {
	const reg = new Registry(event.receipt.contractAddress.toHexString());
	reg.ideas = [];
	reg.save();
};

/**
 * Called when an instance of the idea contract is created by the registry.
 */
export const handleIdeaCreated = (event: IdeaCreated) => {
	// Create entity
	const idea = new Idea(event.params.idea.toHexString());

	// Recipient is the registry
	const reg = Registry.load(event.transaction.to.toHexString());
	reg.ideas.push(idea.id);
	reg.save();

	// No activity yet
	idea.children = [];
	idea.parents = [];
	idea.users = [];

	// Details stored in contract state
	const deployed = IdeaContract.bind(event.receipt.contractAddress);
	idea.ipfsAddr = deployed.ipfsAddr();
	idea.ticker = deployed.symbol();
	idea.name = deployed.name();
	idea.supply = deployed.totalSupply();

	// Save the object in the db
	idea.save();

	// Listen to the contract
	IdeaSrc.create(event.params.idea);
};
