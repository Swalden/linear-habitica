import { Issue, LinearClient } from "@linear/sdk";
import { config } from "dotenv";

config();

const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY,
});

async function sync() {
  const issues = await getMyIssues();
  const habiticaTodos = await getHabiticaTodos();

  const habiticaTodoTitles = habiticaTodos.data.map((data) => data.text);

  for (const issue of issues) {
    const issueTitle = `${issue.identifier}: ${issue.title}`;
    if (!habiticaTodoTitles.includes(issueTitle)) {
      await createHabiticaTodo(issueTitle);
    }
  }
}

async function createHabiticaTodo(title: string) {
  const habiticaApiKey = process.env.HABITICA_API_KEY;
  try {
    const todo = await fetch(`https://habitica.com/api/v3/tasks/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-user": process.env.HABITICA_API_USER,
        "x-api-key": habiticaApiKey,
        "x-client": "linear-habitica-sync",
      },
      body: JSON.stringify({
        text: title,
        type: "todo",
      }),
    });
  } catch (error) {
    console.error(error);
  }
}

async function getMyIssues(): Promise<Issue[] | null> {
  const me = await linearClient.viewer;
  const myIssues = await me.assignedIssues();

  if (!myIssues.nodes.length) return null;

  return myIssues.nodes;
}

// Get habitica todos from https://habitica.com/api/v3/tasks/user
async function getHabiticaTodos() {
  const habiticaApiKey = process.env.HABITICA_API_KEY;
  const response = await fetch(
    `https://habitica.com/api/v3/tasks/user?type=todos`,
    {
      headers: {
        "x-api-user": process.env.HABITICA_API_USER,
        "x-api-key": habiticaApiKey,
        "x-client": "linear-habitica-sync",
      },
    },
  );
  return response.json();
}

sync();
