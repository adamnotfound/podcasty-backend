import { SSTConfig } from "sst";
import { Podcasty } from "./stacks/Podcasty";

export default {
  config(_input) {
    return {
      name: "podcasty",
      region: "eu-central-1",
    };
  },
  stacks(app) {
    app.stack(Podcasty);
  },
} satisfies SSTConfig;
