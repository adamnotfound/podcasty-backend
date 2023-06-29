import { Api, StackContext, Table } from "sst/constructs";

export function Podcasty({ stack }: StackContext) {
  // Create the table
  const table = new Table(stack, "Result", {
    fields: {
      id: "number", // Partition key
      query: "string", // The search query
      result: "string", // The search result (JSON string)
      timestamp: "string", // Timestamp of when the result was saved
    },
    primaryIndex: { partitionKey: "id" },
  });
  // Create the HTTP API
  const api = new Api(stack, "Api", {
    cors: true,
    defaults: {
      function: {
        // Bind the table name to our API
        bind: [table],
      },
    },
    routes: {
      "GET /search/{query}": "packages/functions/src/search.main",
    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
