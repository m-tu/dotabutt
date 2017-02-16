
function findCounts(player, success) {
	let api = 'https://api.opendota.com/api/';
	let matchesUrl = api + 'players/' + player.id + '/matches';

	let params = {
		date: 7,
		lobby_type: 7 //ranked
	};

	fetch(matchesUrl + serializeGetParams(params))
		.then( res => {
			return res.json();
		})
		.then( matches => groupByHero(matches))
		.then( (heroCounts) => {
			const heroesUrl = api + 'heroes';
			fetch(heroesUrl).then( res => {
				res.json().then( heros => {
					let stats = [];
					for( let heroId in heroCounts) {
						const hero = findHeroById(heros, heroId);
						const heroStats = heroCounts[heroId];

						stats.push({
							name: hero.localized_name,
							games: heroStats.count,
							wins: heroStats.wins,
							losses: heroStats.count - heroStats.wins
						});
					}

					stats.sort((a, b) => b.games - a.games);
					success(stats);
				});
			});
		});
}

function findHeroById(heros, id) {
	return heros.find(el => {
		if(el.id === parseInt(id)) {
			return el;
		}
	});
}

function groupByHero(matches) {
	var heroes = {};
	matches.forEach( match => {
		let win = match.player_slot <= 4 && match.radiant_win || match.player_slot > 4 && !match.radiant_win;

		if(heroes[match.hero_id]) {
			heroes[match.hero_id].count += 1;
			if(win) {
				heroes[match.hero_id].wins += 1;
			}
		} else {
			heroes[match.hero_id] = {count: 1, wins: win ? 1 : 0};
		}


	});
	return heroes;
}

function serializeGetParams(params) {
	let query = [];
	for(let p in params) {
		query.push(p + '=' + params[p]);
	}
	return '?' + query.join('&');
}

function addPlayerChart(info) {
	let container = document.createElement("div");
	container.id = "pchart-" + info.id;
	container.style.minWidth = "300px";
	container.style.height = "400px";
	container.style.margin = "5px 0 0 0";

	let charts = document.getElementById("charts");
	charts.appendChild(container);

	let names = info.stats.map(s => s.name);
	let winSeries = info.stats.map(s => s.wins);
	let loseSeries = info.stats.map(s => s.losses);

	Highcharts.chart(container.id, {
		chart: { type: "column" },
		title: { text: info.name + " W/L per hero" },
		xAxis: { categories: names },
		yAxis: { min: 0, stackLabels: {
			enabled: true,
			style: {
				fontWeight: "bold",
				color: (Highcharts.theme && Highcharts.theme.textColor) || "gray"
			}
		}},
		legend: {
			align: "right",
			x: -30,
			verticalAlign: "top",
			y: 25,
			floating: true,
			backgroundColor: (Highcharts.theme && Highcharts.theme.background2) ||"white",
			borderColor: "#CCC",
			borderWidth: 1,
			shadow: false
		},
		plotOptions: {
			column: {
				stacking: "normal",
				dataLabels: {
					enabled: true,
					color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) ||"white"
				}
			}
		},
		series: [{
			name: "Wins",
			data: winSeries
		}, {
			name: "Losses",
			data: loseSeries
		}]
	})
}

let players = {
  30277848: "Aqua",
  94537401: "Marten",
  56056709: "Uku",
  5559243: "Madis",
  104356591: "+2 pizza"
};

function loadMMRGraph() {
  fetch("/mmr").then(res => res.json()).then(mmrs => {
    let mmrById = {};

    for (let i = 0; i < mmrs.length; i++) {
      let m = mmrs[i];
      if (!mmrById[m.player_id]) {
        mmrById[m.player_id] = [];
      }
      mmrById[m.player_id].push([new Date(m.timestamp).valueOf(), m.mmr]);
    }

    let series = [];

    for (let playerId in mmrById) {
      let mmrSeq = mmrById[playerId];
      series.push({
        name: players[playerId],
        data: mmrSeq
      });
    }

    Highcharts.chart("mmrChart", {
      chart: { type: "spline" },
      title: { text: "Weekly MMR" },
      yAxis: { title: { text: "MMR" } },
      xAxis: { type: "datetime", title: { text: "Date" } },
      legend: {
        layout: "vertical",
        align: "right",
        verticalAlign: "middle",
      },
      series: series
    });
  });
}

loadMMRGraph();

let playerList = document.getElementById("players");
for (let k in players) {
  let name = players[k];
  let p = {id: k, name: name};
  findCounts(p, stats => {
	let gameCount = 0;
	let wins = 0;

	stats.forEach(h => {
		gameCount += h.games;
		wins += h.wins;
	});

	let losses = gameCount - wins;

	let winRatio = (wins / gameCount) * 100.0;

	let playerItem = document.createElement("li");
	let playerStat = document.createTextNode(
		p.name + " - " + gameCount + " games - " + winRatio.toFixed(1) + "%");
	playerItem.appendChild(playerStat);
	playerList.appendChild(playerItem);

	addPlayerChart({
		name: p.name,
		id: p.id,
		stats: stats
	});
  });
}
