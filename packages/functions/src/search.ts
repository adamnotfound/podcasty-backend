import { DynamoDB } from "aws-sdk";
import { Table } from "sst/node/table";
import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";
const dynamoDb = new DynamoDB.DocumentClient();
const getBrightColor = (idNumber: number) =>
  `#${((Math.abs(Math.sin(idNumber)) * 0xffffff) | 0x111000)
    .toString(16)
    .padStart(6, "0")}`;

export async function main(event: APIGatewayProxyEvent) {
  try {
    const searchWord = event.pathParameters?.query;
    if (!searchWord) throw new Error("Search word missing");
    const baseURL = `https://itunes.apple.com/search?term=${searchWord}`;
    const podcastResponse = await axios.get(`${baseURL}&entity=podcast`);
    const episodeResponse = await axios.get(`${baseURL}&entity=podcastEpisode`);
    let results = {};
    // In case of successful requests for both podcasts & episodes save results
    if (podcastResponse.status === 200 && episodeResponse.status === 200) {
      let podcasts = podcastResponse.data.results.map((p: any) => {
        let {
          trackId,
          trackName,
          collectionId,
          collectionName,
          artworkUrl600,
          kind,
          trackTimeMillis,
          releaseDate,
        } = p;
        return {
          trackId,
          trackName,
          collectionId,
          collectionName,
          artworkUrl600,
          kind,
          trackTimeMillis,
          releaseDate,
          hue: getBrightColor(collectionId),
        };
      });
      let episodes = episodeResponse.data.results.map((p: any) => {
        let {
          trackId,
          trackName,
          collectionId,
          collectionName,
          artworkUrl600,
          trackTimeMillis,
          releaseDate,
          kind,
        } = p;

        return {
          trackId,
          trackName,
          collectionId,
          collectionName,
          artworkUrl600,
          trackTimeMillis,
          releaseDate,
          kind,
          hue: getBrightColor(collectionId),
        };
      });
      results = { podcasts, episodes };
      // Saving results in database
      const putParams = {
        TableName: Table.Result.tableName,
        Item: {
          id: parseInt(Date.now().toString()),
          query: searchWord,
          result: JSON.stringify(results),
          timestamp: new Date().toISOString(),
        },
      };
      await dynamoDb.put(putParams).promise();
    }

    console.log("Success");
    return {
      statusCode: 200,
      body: JSON.stringify(results),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      body: err.message ? err.message : "Error",
    };
  }
}
