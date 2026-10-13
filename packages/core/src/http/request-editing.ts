import { syncPathVariablesFromUrl } from "./path-variables";
import { buildUrlFromQueryParameters, syncQueryParametersFromUrl } from "./query-parameters";
import type { KeyValueEntry } from "../models/key-value-entry.schema";
import type { HttpRequestDefinition } from "../models/request.schema";

/**
 * Edits that keep the URL, the query parameter table (F-03) and the path variable table (F-04)
 * consistent. Both the URL bar and the tables call these, so neither can drift from the other.
 */

/** Sets the URL and updates both tables from it. */
export function withUrl(request: HttpRequestDefinition, url: string): HttpRequestDefinition {
  return {
    ...request,
    url,
    queryParameters: syncQueryParametersFromUrl(url, request.queryParameters),
    pathVariables: syncPathVariablesFromUrl(url, request.pathVariables),
  };
}

/** Sets the query parameter table and rewrites the URL's query string from it. */
export function withQueryParameters(
  request: HttpRequestDefinition,
  queryParameters: readonly KeyValueEntry[],
): HttpRequestDefinition {
  return {
    ...request,
    url: buildUrlFromQueryParameters(request.url, queryParameters),
    queryParameters: [...queryParameters],
  };
}

/**
 * Sets path variable values. The names come from the URL, so rows whose name is no longer in it
 * are dropped and missing ones are added.
 */
export function withPathVariables(
  request: HttpRequestDefinition,
  pathVariables: readonly KeyValueEntry[],
): HttpRequestDefinition {
  return { ...request, pathVariables: syncPathVariablesFromUrl(request.url, pathVariables) };
}
