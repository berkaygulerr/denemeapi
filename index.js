const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const cors = require("cors");

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

app.use(cors());

app.get("/standing/:leagueName", async (req, res) => {
  try {
    const leagueName = req.params.leagueName;

    var league = {};

    switch (leagueName) {
      case "nations-league":
        league.leagueId = "10783";
        league.seasonId = "58337";
        break;
      case "super-lig":
        league.leagueId = "52";
        league.seasonId = "63814";
        break;
      case "premier-league":
        league.leagueId = "17";
        league.seasonId = "61627";
        break;

      default:
        break;
    }

    const host = "free-api-live-football-data.p.rapidapi.com";

    const options = {
      method: "GET",
      url: `https://${host}/football-league-standings-total`,
      params: {
        leagueid: league.leagueId,
        seasonid: league.seasonId,
      },
      headers: {
        "x-rapidapi-key": process.env.API_KEY,
        "x-rapidapi-host": host,
      },
    };

    const response = await axios.request(options);
    const data = response.data;
    const standings = data.response.standings;

    if (leagueName == "nations-league")
      var teamTranslations = loadTeamTranslations();

    const groups = {};

    standings.map(async (standing, index) => {
      const tournament = standing.tournament;

      if (leagueName == "nations-league") var groupName = groupNamesTr[index];
      else var groupName = tournament.name;

      groups[groupName] = [];

      standing.rows.map((row) => {
        const team = row.team;

        const teamData = {
          rank: row.position,
          team: teamTranslations ? teamTranslations[row.id].name : team.name,
          slug: team.slug,
          id: team.id,
          played: row.matches,
          win: row.wins,
          draw: row.draws,
          lose: row.losses,
          goalfor: row.scoresFor,
          goalagainst: row.scoresAgainst,
          goaldistance: row.scoresFor - row.scoresAgainst,
          point: row.points,
          logo: teamTranslations ? teamTranslations[row.id].name : "",
          league: tournament.name,
          leagueslug: tournament.slug,
        };

        groups[groupName].push(teamData);
      });
    });

    res.set({
      "Cache-Control": "public, max-age=15, must-revalidate",
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
