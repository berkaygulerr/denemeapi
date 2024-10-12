const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const groupNamesTr = [
  "A LİGİ, 1. GRUP",
  "A LİGİ, 2. GRUP",
  "A LİGİ, 3. GRUP",
  "A LİGİ, 4. GRUP",
  "B LİGİ, 1. GRUP",
  "B LİGİ, 2. GRUP",
  "B LİGİ, 3. GRUP",
  "B LİGİ, 4. GRUP",
  "C LİGİ, 1. GRUP",
  "C LİGİ, 2. GRUP",
  "C LİGİ, 3. GRUP",
  "C LİGİ, 4. GRUP",
  "D LİGİ, 1. GRUP",
  "D LİGİ, 2. GRUP",
];

function loadTeamTranslations() {
  try {
    const dataPath = path.join(__dirname, "data", "team-translations.json");
    const fileData = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    console.error("Error loading team translations:", error);
    return {};
  }
}

app.get("/api/standings", async (req, res) => {
  try {
    const options = {
      method: "GET",
      url: "https://free-api-live-football-data.p.rapidapi.com/football-league-standings-total",
      params: {
        leagueid: "10783",
        seasonid: "58337",
      },
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": "free-api-live-football-data.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    const data = response.data;
    const standings = data.response.standings;

    const teamTranslations = loadTeamTranslations();
    const groups = {};

    await Promise.all(
      standings.map(async (standing, index) => {
        const groupName = groupNamesTr[index];
        groups[groupName] = [];

        await Promise.all(
          standing.rows.map((team) => {
            const teamData = {
              rank: team.position,
              team: teamTranslations[team.id]?.name || team.team.name,
              slug: team.team.slug,
              id: team.team.id,
              played: team.matches,
              win: team.wins,
              draw: team.draws,
              lose: team.losses,
              goalfor: team.scoresFor,
              goalagainst: team.scoresAgainst,
              goaldistance: team.scoresFor - team.scoresAgainst,
              point: team.points,
              logo: teamTranslations[team.id]?.logo,
              league: "nations-league",
            };

            groups[groupName].push(teamData);
          })
        );
      })
    );

    res.set({
      "Cache-Control": "public, max-age=15, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    return res.json(groups);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Veri alınırken bir hata oluştu" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
