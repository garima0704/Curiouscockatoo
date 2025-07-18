import PocketBase from "pocketbase";

const pb = new PocketBase("https://curiouscockatoo.com");
pb.autoCancellation(false);

export default pb;
