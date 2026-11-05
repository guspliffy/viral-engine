// Which class builds a character (stage.js): the rig named in its file. "potato" (and files from before rigs had
// names) -> potato.js Character, exactly as before; "friends-v1" -> the Little Chaos Club rig (friends.js). Any other
// name stops the render with a clear error instead of quietly drawing a potato.
import { Character } from "../potato.js";
import { FriendCharacter, setFriendsRig } from "./friends.js";

const RIGS = { potato: Character, "friends-v1": FriendCharacter };
export function makeCharacter(def, key) {
  const C = RIGS[def.rig ?? "potato"];
  if (!C) throw new Error(`unknown rig "${def.rig}" for ${def.id || key}: known rigs are ${Object.keys(RIGS).join(", ")}`);
  return new C(def, key);
}
export { setFriendsRig };
