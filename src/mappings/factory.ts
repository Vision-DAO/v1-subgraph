import { FactoryCreated, IdeaCreated } from "../generated/Factory/Factory";
import { Registry } from "../generated/schema";

/**
 * Called when the registry gets created
 */
export const handleFactoryCreated = (event: FactoryCreated) => {
  event;
};

/**
 * Called when an instance of the idea contract is created by the registry.
 */
export const handleIdeaCreated = (event: IdeaCreated) => {};
