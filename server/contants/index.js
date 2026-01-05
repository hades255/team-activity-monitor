const HIDDEN_APPS = ["LockApp.exe", "TeamMonitor.exe"];

const BANNED_APPS = [
  "dota2.exe",
  "AoK HD.exe",
  "hl.exe",
  "war3.exe",
  "Dota2Start.exe",
  "game.exe",
  "fifa.exe",
  "call_to_arms.exe",
  "dnplayer.exe",
  "vietnam.exe",
  "mowas_2.exe",
  "CivilizationV.exe",
  "SAN14_EN.exe",
];

const BANNED_APPS_TITLE = {
  "Dota2Start.exe": "Dota 2",
  "dota2.exe": "Dota 2",
  "AoK HD.exe": "Age of Empire",
  "hl.exe": "CS",
  "war3.exe": "Dota 1",
  "game.exe": "RA 2",
  "fifa.exe": "FIFA",
  "call_to_arms.exe": "Call to ARMs",
  "vietnam.exe": "MOW Vietnam",
  "mowas_2.exe": "MOW 2",
  "dnplayer.exe": "LD Games",
  "CivilizationV.exe": "Civilization V",
  "SAN14_EN.exe": "San 14",
};

module.exports = {
  HIDDEN_APPS,
  BANNED_APPS,
  BANNED_APPS_TITLE,
};
