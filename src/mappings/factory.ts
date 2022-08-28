import { FactoryCreated, IdeaCreated } from "../generated/Factory/Factory";
import { Registry, Idea } from "../generated/schema";

/**
 * Called when the registry gets created
 */
export const handleFactoryCreated = (event: FactoryCreated) => {
	const reg = new Registry(event.params.registry);
	reg.ideas = [];
	reg.save();
};

/**
 * Called when an instance of the idea contract is created by the registry.
 */
export const handleIdeaCreated = (event: IdeaCreated) => {
	// Already created by handleIdeaRecorded
	const idea = Idea.load(event.params.idea);

	const reg = Registry.load(event.params.registry);
	reg.ideas.push(idea.id);
	reg.save();
};
