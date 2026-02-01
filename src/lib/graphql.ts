const GRAPHQL_ENDPOINT: string =
  import.meta.env.PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:3000/graphql";

interface GraphQLErrorItem {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLErrorItem[];
}

export async function fetchGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    const message = json.errors.map((e) => e.message).join(", ");
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error("No data returned from GraphQL API");
  }

  return json.data;
}
